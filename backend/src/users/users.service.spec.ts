import {
  BadRequestException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { describe, expect, it, vi } from 'vitest';
import { validate } from 'class-validator';
import { UsersService } from './users.service.js';
import { ConsolePreferencesDto, UpdateAvatarDto } from './account.dto.js';
import { JwtStrategy } from '../auth/strategies/jwt.strategy.js';
import { AdminService } from '../admin/admin.service.js';
import type { PrismaService } from '../prisma/prisma.service.js';

function mockPrisma(tx: object) {
  return {
    ...tx,
    $transaction: async (fn: (transaction: object) => unknown) => fn(tx),
  } as unknown as PrismaService;
}
describe('Account security and preferences', () => {
  it('rejects a wrong current password without changing credentials', async () => {
    const hash = await bcrypt.hash('correct-password', 4);
    const transaction = vi.fn();
    const prisma = {
      user: { findUnique: vi.fn().mockResolvedValue({ passwordHash: hash }) },
      $transaction: transaction,
    } as unknown as PrismaService;
    await expect(
      new UsersService(prisma).updatePassword('user', {
        currentPassword: 'wrong-password',
        newPassword: 'new-password',
      }),
    ).rejects.toThrow(BadRequestException);
    expect(transaction).not.toHaveBeenCalled();
  });
  it('hashes the new password, invalidates access tokens and revokes refresh sessions atomically', async () => {
    const hash = await bcrypt.hash('old-password', 4);
    const tx = {
      user: {
        findUnique: vi.fn().mockResolvedValue({ passwordHash: hash }),
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
      refreshToken: { updateMany: vi.fn() },
      auditLog: { create: vi.fn() },
    };
    await new UsersService(mockPrisma(tx)).updatePassword('user', {
      currentPassword: 'old-password',
      newPassword: 'new-password',
    });
    const saved = tx.user.updateMany.mock.calls[0][0];
    expect(await bcrypt.compare('new-password', saved.data.passwordHash)).toBe(
      true,
    );
    expect(saved.where.passwordHash).toBe(hash);
    expect(saved.data.tokenVersion).toEqual({ increment: 1 });
    expect(tx.refreshToken.updateMany.mock.calls[0][0].where).toEqual({
      userId: 'user',
      revokedAt: null,
    });
    const audit = JSON.stringify(tx.auditLog.create.mock.calls);
    expect(audit).not.toContain('old-password');
    expect(audit).not.toContain('new-password');
    expect(audit).not.toContain(hash);
  });
  it('rejects a stale access token after the password changes', async () => {
    const prisma = {
      user: {
        findUnique: vi
          .fn()
          .mockResolvedValue({
            id: 'user',
            role: 'support_agent',
            email: null,
            status: 'active',
            tokenVersion: 1,
          }),
      },
    } as unknown as PrismaService;
    const config = {
      getOrThrow: () => 'test-secret-with-at-least-thirty-two-characters',
    } as unknown as ConfigService;
    const strategy = new JwtStrategy(config, prisma);
    await expect(
      strategy.validate({ sub: 'user', role: 'admin', ver: 0 }),
    ).rejects.toThrow(UnauthorizedException);
    expect(
      (await strategy.validate({ sub: 'user', role: 'admin', ver: 1 })).role,
    ).toBe('support_agent');
  });
  it('rejects a concurrent password change instead of overwriting it', async () => {
    const hash = await bcrypt.hash('old-password', 4);
    const tx = {
      user: {
        findUnique: vi.fn().mockResolvedValue({ passwordHash: hash }),
        updateMany: vi.fn().mockResolvedValue({ count: 0 }),
      },
      refreshToken: { updateMany: vi.fn() },
    };
    await expect(
      new UsersService(mockPrisma(tx)).updatePassword('user', {
        currentPassword: 'old-password',
        newPassword: 'new-password',
      }),
    ).rejects.toThrow(ConflictException);
    expect(tx.refreshToken.updateMany).not.toHaveBeenCalled();
  });
  it('rejects SVGs, external image addresses and incorrect image signatures', async () => {
    const service = new UsersService({} as PrismaService);
    for (const image of [
      'data:image/svg+xml;base64,PHN2Zz4=',
      'https://example.com/image.png',
      'data:image/png;base64,YWJjZGVmZ2hpamtsbW5vcA==',
    ])
      await expect(service.updateAvatar('user', image)).rejects.toThrow(
        BadRequestException,
      );
  });
  it('persists a photo without putting its contents in the audit log, and supports removal', async () => {
    const avatar =
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/lXcAAAAASUVORK5CYII=';
    const tx = {
      user: { update: vi.fn().mockResolvedValue({ id: 'user', avatar }) },
      auditLog: { create: vi.fn() },
    };
    const service = new UsersService(mockPrisma(tx));
    await service.updateAvatar('user', avatar);
    await service.updateAvatar('user', null);
    expect(tx.user.update.mock.calls[0][0].data.avatar).toBe(avatar);
    expect(tx.user.update.mock.calls[1][0].data.avatar).toBeNull();
    expect(JSON.stringify(tx.auditLog.create.mock.calls)).not.toContain(avatar);
  });
  it('validates preference choices and requires an avatar field', async () => {
    const preferences = Object.assign(new ConsolePreferencesDto(), {
      density: 'invalid',
      dateFormat: 'locale',
      timeZone: 'UTC',
      refreshInterval: 60,
      reducedMotion: false,
    });
    expect(
      (await validate(preferences)).map((error) => error.property),
    ).toContain('density');
    expect((await validate(new UpdateAvatarDto())).length).toBeGreaterThan(0);
  });
  it('saves regional preferences and workspace preferences together', async () => {
    const tx = {
      user: { update: vi.fn().mockResolvedValue({ id: 'user' }) },
      auditLog: { create: vi.fn() },
    };
    await new UsersService(mockPrisma(tx)).updatePreferences('user', {
      language: 'ps_AF',
      currency: 'USD',
      density: 'compact',
      dateFormat: 'iso',
      timeZone: 'UTC',
      refreshInterval: 0,
      reducedMotion: true,
    });
    const data = tx.user.update.mock.calls[0][0].data;
    expect(data.language).toBe('ps_AF');
    expect(data.currency).toBe('USD');
    expect(data.consolePreferences).toEqual({
      density: 'compact',
      dateFormat: 'iso',
      timeZone: 'UTC',
      refreshInterval: 0,
      reducedMotion: true,
    });
  });
  it('lets admins promote customers into administrators and staff, without revoking their live refresh session', async () => {
    const tx = {
      $queryRaw: vi.fn(),
      user: {
        findUnique: vi
          .fn()
          .mockResolvedValue({ role: 'customer', status: 'active' }),
        update: vi.fn().mockResolvedValue({ id: 'target', role: 'admin' }),
      },
      auditLog: { create: vi.fn() },
      refreshToken: { updateMany: vi.fn() },
    };
    const service = new AdminService(mockPrisma(tx));
    for (const role of [
      'admin',
      'support_agent',
      'finance_agent',
      'content_manager',
      'verification_agent',
    ] as const)
      await service.updateUser(
        'target',
        { role },
        { sub: 'actor', role: 'admin', email: null },
      );
    expect(tx.user.update).toHaveBeenCalledTimes(5);
    expect(tx.refreshToken.updateMany).not.toHaveBeenCalled();
  });
});
