import { ConflictException, ForbiddenException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';

import type { AuthenticatedUser } from '../common/types/authenticated-user.js';
import type { PrismaService } from '../prisma/prisma.service.js';
import { RoomsService } from './rooms.service.js';

function createService() {
  const prisma = {
    property: { findUnique: vi.fn() },
    room: { findUnique: vi.fn() },
    bed: { create: vi.fn() },
    amenity: { findUnique: vi.fn() },
    propertyAmenity: { create: vi.fn() },
  } as unknown as PrismaService;

  return { prisma, service: new RoomsService(prisma) };
}

const owner: AuthenticatedUser = {
  sub: 'owner-id',
  role: 'property_owner',
  email: 'owner@example.test',
};

const bedInput = {
  bedNumber: 'A1',
  gender: 'any' as const,
  price: 350,
};

describe('RoomsService bed and amenity operations', () => {
  it('creates a bed under an owned room', async () => {
    const { prisma, service } = createService();
    prisma.room.findUnique = vi
      .fn()
      .mockResolvedValue({ propertyId: 'property-id' });
    prisma.property.findUnique = vi
      .fn()
      .mockResolvedValue({ ownerId: owner.sub });
    const created = { id: 'bed-id', ...bedInput, roomId: 'room-id' };
    prisma.bed.create = vi.fn().mockResolvedValue(created);

    await expect(
      service.createBed('room-id', bedInput, owner),
    ).resolves.toEqual(created);
    expect(prisma.bed.create).toHaveBeenCalledWith({
      data: {
        roomId: 'room-id',
        ...bedInput,
        gender: 'any',
        status: 'available',
      },
      include: { room: { select: { id: true, roomNumber: true } } },
    });
  });

  it('denies bed creation for a room owned by someone else', async () => {
    const { prisma, service } = createService();
    prisma.room.findUnique = vi
      .fn()
      .mockResolvedValue({ propertyId: 'property-id' });
    prisma.property.findUnique = vi
      .fn()
      .mockResolvedValue({ ownerId: 'other-owner' });

    await expect(
      service.createBed('room-id', bedInput, owner),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.bed.create).not.toHaveBeenCalled();
  });

  it('converts duplicate bed numbers to a conflict', async () => {
    const { prisma, service } = createService();
    prisma.room.findUnique = vi
      .fn()
      .mockResolvedValue({ propertyId: 'property-id' });
    prisma.property.findUnique = vi
      .fn()
      .mockResolvedValue({ ownerId: owner.sub });
    prisma.bed.create = vi.fn().mockRejectedValue({ code: 'P2002' });

    await expect(
      service.createBed('room-id', bedInput, owner),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('checks property ownership before assigning a catalog amenity', async () => {
    const { prisma, service } = createService();
    prisma.property.findUnique = vi
      .fn()
      .mockResolvedValue({ ownerId: 'other-owner' });

    await expect(
      service.addPropertyAmenity('property-id', 'amenity-id', owner),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.amenity.findUnique).not.toHaveBeenCalled();
    expect(prisma.propertyAmenity.create).not.toHaveBeenCalled();
  });
});
