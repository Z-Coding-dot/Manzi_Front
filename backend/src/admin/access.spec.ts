import { describe, it, expect, vi } from 'vitest';
import { Reflector } from '@nestjs/core';
import {
  ForbiddenException,
  BadRequestException,
  type ExecutionContext,
} from '@nestjs/common';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { AdminController } from './admin.controller.js';
import { AdminCmsController } from '../cms/cms.controller.js';
import { OperationsController } from '../operations/operations.controller.js';
import { PropertiesController } from '../properties/properties.controller.js';
import { ViewsController } from './views.controller.js';
import { AdminService } from './admin.service.js';
import type { PrismaService } from '../prisma/prisma.service.js';
function allowed(controller: any, handler: string, role: string) {
  const context = {
    getHandler: () => controller.prototype[handler],
    getClass: () => controller,
    switchToHttp: () => ({
      getRequest: () => ({ user: { sub: 'test', role } }),
    }),
  } as unknown as ExecutionContext;
  return new RolesGuard(new Reflector()).canActivate(context);
}
describe('Platform staff permissions', () => {
  it.each([
    [AdminCmsController, 'createPage', 'content_manager'],
    [OperationsController, 'tickets', 'support_agent'],
    [OperationsController, 'moderate', 'support_agent'],
    [OperationsController, 'approve', 'finance_agent'],
    [PropertiesController, 'findAll', 'verification_agent'],
    [PropertiesController, 'review', 'verification_agent'],
    [ViewsController, 'stats', 'super_admin'],
  ])('allows assigned duties', (controller, handler, role) =>
    expect(allowed(controller, handler, role)).toBe(true),
  );
  it.each([
    [AdminController, 'users', 'support_agent'],
    [AdminCmsController, 'settings', 'content_manager'],
    [AdminCmsController, 'saveSetting', 'admin'],
    [OperationsController, 'approve', 'support_agent'],
    [PropertiesController, 'update', 'verification_agent'],
    [ViewsController, 'stats', 'property_owner'],
    [ViewsController, 'stats', 'content_manager'],
  ])('blocks unrelated duties', (controller, handler, role) =>
    expect(() => allowed(controller, handler, role)).toThrow(
      ForbiddenException,
    ),
  );
  it('protects existing administrators from peer administrators', async () => {
    const tx = {
      $queryRaw: vi.fn(),
      user: {
        findUnique: vi.fn().mockResolvedValue({ role: 'admin' }),
      },
    };
    const prisma = { $transaction: async (fn: any) => fn(tx) };
    await expect(
      new AdminService(prisma as unknown as PrismaService).updateUser(
        'staff',
        { status: 'suspended' },
        { sub: 'admin', role: 'admin', email: null },
      ),
    ).rejects.toThrow(ForbiddenException);
  });
  it('preserves the last active platform owner', async () => {
    const tx = {
      $queryRaw: vi.fn(),
      user: {
        findUnique: vi
          .fn()
          .mockResolvedValue({ role: 'super_admin', status: 'active' }),
        count: vi.fn().mockResolvedValue(1),
      },
    };
    const prisma = { $transaction: async (fn: any) => fn(tx) };
    await expect(
      new AdminService(prisma as unknown as PrismaService).updateUser(
        'owner',
        { role: 'customer' },
        { sub: 'another', role: 'super_admin', email: null },
      ),
    ).rejects.toThrow(BadRequestException);
  });
});
