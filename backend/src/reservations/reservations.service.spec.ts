import { ConflictException, ForbiddenException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import type { Prisma, UserRole } from '@prisma/client';
import type { PrismaService } from '../prisma/prisma.service.js';
import { ReservationsService } from './reservations.service.js';
const user = { sub: 'owner', role: 'property_owner' as UserRole, email: null };
describe('Reservation isolation and availability', () => {
  it('rejects a property owned by another user', async () => {
    const prisma = { property: { findUnique: vi.fn().mockResolvedValue({ ownerId: 'another-owner', staff: [] }) } };
    await expect(new ReservationsService(prisma as unknown as PrismaService).propertyScope('property', user)).rejects.toBeInstanceOf(ForbiddenException);
  });
  it('allows only an active staff membership returned by the scoped query', async () => {
    const prisma = { property: { findUnique: vi.fn().mockResolvedValue({ ownerId: 'another-owner', staff: [{ userId: 'owner' }] }) } };
    await new ReservationsService(prisma as unknown as PrismaService).propertyScope('property', user);
    expect(prisma.property.findUnique).toHaveBeenCalledWith(expect.objectContaining({ include: { staff: { where: { userId: 'owner', status: 'active' } } } }));
  });
  it('rejects a customer reading another customer reservation', async () => {
    const prisma = { reservation: { findUnique: vi.fn().mockResolvedValue({ customerId: 'other' }) } };
    await expect(new ReservationsService(prisma as unknown as PrismaService).one('reservation', { ...user, role: 'customer' })).rejects.toBeInstanceOf(ForbiddenException);
  });
  it('checks both the selected bed and a whole-room reservation for overlapping dates', async () => {
    const prisma = { reservation: { findFirst: vi.fn().mockResolvedValue({ id: 'occupied' }) } };
    const service = new ReservationsService(prisma as unknown as PrismaService);
    const start = new Date('2026-10-10'), end = new Date('2026-10-12');
    await expect(service.available(prisma as unknown as Prisma.TransactionClient, 'room', 'bed', start, end)).rejects.toBeInstanceOf(ConflictException);
    expect(prisma.reservation.findFirst).toHaveBeenCalledWith({ where: expect.objectContaining({ roomId: 'room', OR: [{ bedId: 'bed' }, { bedId: null }], checkIn: { lt: end }, checkOut: { gt: start } }) });
  });
  it('excludes the current reservation during an extension', async () => {
    const prisma = { reservation: { findFirst: vi.fn().mockResolvedValue(null) } };
    await new ReservationsService(prisma as unknown as PrismaService).available(prisma as unknown as Prisma.TransactionClient, 'room', undefined, new Date('2026-10-10'), new Date('2026-10-12'), 'current');
    expect(prisma.reservation.findFirst).toHaveBeenCalledWith({ where: expect.objectContaining({ id: { not: 'current' } }) });
  });
});
