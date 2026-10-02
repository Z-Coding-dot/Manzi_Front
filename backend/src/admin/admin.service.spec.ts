import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { ExecutionContext } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../prisma/prisma.service.js';
import { AdminService } from './admin.service.js';
import { AdminController } from './admin.controller.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
const actor = { sub: 'admin', role: 'admin' as const, email: null };
describe('Admin access boundaries', () => {
  it('blocks a property owner on the platform statistics endpoint', () => {
    const context = {
      getHandler: () => AdminController.prototype.stats,
      getClass: () => AdminController,
      switchToHttp: () => ({
        getRequest: () => ({ user: { ...actor, role: 'property_owner' } }),
      }),
    } as unknown as ExecutionContext;
    expect(() => new RolesGuard(new Reflector()).canActivate(context)).toThrow(
      ForbiddenException,
    );
  });
  it('does not let an administrator suspend their own account', async () => {
    await expect(
      new AdminService({} as PrismaService).updateUser(
        'admin',
        { status: 'suspended' },
        actor,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
  it('requires a super administrator to grant roles', async () => {
    const tx = {
      user: { findUnique: vi.fn().mockResolvedValue({ role: 'customer' }) },
    };
    const prisma = {
      $transaction: async (callback: (tx: unknown) => unknown) => callback(tx),
    };
    await expect(
      new AdminService(prisma as unknown as PrismaService).updateUser(
        'target',
        { role: 'admin' },
        actor,
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
  it('does not return password hashes or tokens to administrators', async () => {
    const prisma = { user: { findMany: vi.fn().mockResolvedValue([]) } };
    await new AdminService(prisma as unknown as PrismaService).users();
    const select = prisma.user.findMany.mock.calls[0][0].select;
    expect(select.passwordHash).toBeUndefined();
    expect(select.refreshTokens).toBeUndefined();
  });
  it('prevents ordinary administrators creating platform administrators', async () => {
    await expect(
      new AdminService({} as PrismaService).createUser(
        {
          name: 'Test',
          email: 'test@example.com',
          password: 'test-password',
          role: 'admin',
        },
        actor,
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
  it('stores a password hash and audits newly created owner accounts without exposing credentials', async () => {
    const tx = {
      user: {
        create: vi
          .fn()
          .mockResolvedValue({
            id: 'new-owner',
            name: 'Test',
            email: 'test@example.com',
            role: 'property_owner',
            status: 'active',
          }),
      },
      auditLog: { create: vi.fn() },
    };
    const prisma = {
      $transaction: async (callback: (tx: unknown) => unknown) => callback(tx),
    };
    const result = await new AdminService(
      prisma as unknown as PrismaService,
    ).createUser(
      {
        name: 'Test',
        email: 'Test@Example.com',
        password: 'test-password',
        role: 'property_owner',
      },
      actor,
    );
    const input = tx.user.create.mock.calls[0][0];
    expect(input.data.email).toBe('test@example.com');
    expect(input.data.passwordHash).not.toBe('test-password');
    expect(input.select.passwordHash).toBeUndefined();
    expect(result).not.toHaveProperty('passwordHash');
    expect(tx.auditLog.create).toHaveBeenCalledOnce();
  });
  it('rejects passwords that bcrypt would silently truncate by byte length', async () => {
    await expect(
      new AdminService({} as PrismaService).createUser(
        {
          name: 'Test',
          email: 'test@example.com',
          password: '\u00e9'.repeat(40),
          role: 'property_owner',
        },
        actor,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
