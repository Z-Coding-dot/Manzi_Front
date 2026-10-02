import { BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../prisma/prisma.service.js';
import type { ReservationsService } from '../reservations/reservations.service.js';
import { OperationsService } from './operations.service.js';
const user = { sub: 'owner', role: 'property_owner' as const, email: null };
function setup(existing: unknown = null, paid = 0) {
  const tx = { $queryRaw: vi.fn(), payment: { findUnique: vi.fn().mockResolvedValue(existing), aggregate: vi.fn().mockResolvedValue({ _sum: { amount: paid } }), create: vi.fn() } };
  const prisma = { $transaction: async (callback: (tx: unknown) => unknown) => callback(tx) };
  const reservations = { one: vi.fn().mockResolvedValue({ id: 'reservation', status: 'confirmed', total: 100, currency: 'AFN' }) };
  return { tx, service: new OperationsService(prisma as unknown as PrismaService, reservations as unknown as ReservationsService) };
}
describe('Append-only cash payments', () => {
  it('returns an existing payment for an identical idempotent retry', async () => {
    const existing = { reservationId: 'reservation', amount: 50 };
    const { service, tx } = setup(existing);
    await expect(service.cashPayment('reservation', { amount: 50, idempotencyKey: 'key' }, user)).resolves.toEqual(existing);
    expect(tx.payment.create).not.toHaveBeenCalled();
  });
  it('rejects reuse of a payment key for a different amount', async () => {
    const { service } = setup({ reservationId: 'reservation', amount: 25 });
    await expect(service.cashPayment('reservation', { amount: 50, idempotencyKey: 'key' }, user)).rejects.toBeInstanceOf(ConflictException);
  });
  it('rejects overpayment without creating any financial row', async () => {
    const { service, tx } = setup(null, 75);
    await expect(service.cashPayment('reservation', { amount: 50, idempotencyKey: 'key' }, user)).rejects.toBeInstanceOf(BadRequestException);
    expect(tx.payment.create).not.toHaveBeenCalled();
  });
});
describe('Housekeeping protects room availability', () => {
  function housekeeping(roomStatus = 'dirty', taskStatus = 'pending') {
    const tx = { $queryRaw: vi.fn(), housekeepingTask: { findUnique: vi.fn().mockResolvedValue({ id: 'task', propertyId: 'property', roomId: 'room', status: taskStatus }), update: vi.fn().mockResolvedValue({ id: 'task' }) }, room: { findUniqueOrThrow: vi.fn().mockResolvedValue({ id: 'room', status: roomStatus }), update: vi.fn() }, user: { findUniqueOrThrow: vi.fn().mockResolvedValue({ name: 'Staff' }) }, auditLog: { create: vi.fn() } };
    const prisma = { $transaction: async (callback: (tx: unknown) => unknown) => callback(tx) };
    const reservations = { propertyScope: vi.fn() };
    return { tx, service: new OperationsService(prisma as unknown as PrismaService, reservations as unknown as ReservationsService) };
  }
  it('never marks an occupied room available', async () => {
    const { service, tx } = housekeeping('occupied', 'done');
    await expect(service.housekeepingStatus('task', { status: 'inspected' }, user)).rejects.toBeInstanceOf(ConflictException);
    expect(tx.room.update).not.toHaveBeenCalled();
  });
  it('requires manager authority for final inspection', async () => {
    const { service, tx } = housekeeping('cleaning', 'done');
    await expect(service.housekeepingStatus('task', { status: 'inspected' }, { ...user, role: 'property_staff' })).rejects.toBeInstanceOf(ForbiddenException);
    expect(tx.room.update).not.toHaveBeenCalled();
  });
  it('rejects skipping the cleaning workflow', async () => {
    const { service, tx } = housekeeping();
    await expect(service.housekeepingStatus('task', { status: 'inspected' }, user)).rejects.toBeInstanceOf(ConflictException);
    expect(tx.housekeepingTask.update).not.toHaveBeenCalled();
  });
});
