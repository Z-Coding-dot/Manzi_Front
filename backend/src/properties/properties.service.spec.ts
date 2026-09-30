import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { VerificationStatus } from '@prisma/client';
import { describe, expect, it, vi } from 'vitest';

import type { AuthenticatedUser } from '../common/types/authenticated-user.js';
import type { PrismaService } from '../prisma/prisma.service.js';
import { PropertiesService } from './properties.service.js';

function createService() {
  const prisma = {
    property: {
      update: vi.fn(),
      updateMany: vi.fn(),
      findUnique: vi.fn(),
      findUniqueOrThrow: vi.fn(),
    },
  } as unknown as PrismaService;

  return { prisma, service: new PropertiesService(prisma) };
}

const admin: AuthenticatedUser = {
  sub: 'admin-id',
  role: 'admin',
  email: 'admin@example.test',
};

describe('PropertiesService.review', () => {
  it('approves a pending property and publishes it', async () => {
    const { prisma, service } = createService();
    const approvedProperty = {
      id: 'property-id',
      verificationStatus: 'approved',
    };
    prisma.property.updateMany = vi.fn().mockResolvedValue({ count: 1 });
    prisma.property.findUniqueOrThrow = vi
      .fn()
      .mockResolvedValue(approvedProperty);

    await expect(
      service.review('property-id', 'approved', admin),
    ).resolves.toEqual(approvedProperty);

    expect(prisma.property.updateMany).toHaveBeenCalledWith({
      where: {
        id: 'property-id',
        verificationStatus: {
          in: [VerificationStatus.submitted, VerificationStatus.under_review],
        },
      },
      data: {
        verificationStatus: 'approved',
        published: true,
      },
    });
  });

  it('rejects a non-admin without touching the database', async () => {
    const { prisma, service } = createService();
    const owner: AuthenticatedUser = {
      sub: 'owner-id',
      role: 'property_owner',
      email: 'owner@example.test',
    };

    await expect(
      service.review('property-id', 'approved', owner),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.property.updateMany).not.toHaveBeenCalled();
  });

  it('rejects a property that is no longer awaiting review', async () => {
    const { prisma, service } = createService();
    prisma.property.updateMany = vi.fn().mockResolvedValue({ count: 0 });
    prisma.property.findUnique = vi
      .fn()
      .mockResolvedValue({ id: 'property-id' });

    await expect(
      service.review('property-id', 'rejected', admin),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('returns not found when the property does not exist', async () => {
    const { prisma, service } = createService();
    prisma.property.updateMany = vi.fn().mockResolvedValue({ count: 0 });
    prisma.property.findUnique = vi.fn().mockResolvedValue(null);

    await expect(
      service.review('missing-id', 'rejected', admin),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});

describe('PropertiesService.submitVerification', () => {
  const owner: AuthenticatedUser = {
    sub: 'owner-id',
    role: 'property_owner',
    email: 'owner@example.test',
  };

  it('allows an owner to resubmit after requested changes', async () => {
    const { prisma, service } = createService();
    prisma.property.findUnique = vi.fn().mockResolvedValue({
      id: 'property-id',
      ownerId: owner.sub,
      verificationStatus: VerificationStatus.changes_requested,
    });
    prisma.property.update = vi.fn().mockResolvedValue({
      id: 'property-id',
      verificationStatus: VerificationStatus.submitted,
      published: false,
    });

    await service.submitVerification('property-id', owner);

    expect(prisma.property.update).toHaveBeenCalledWith({
      where: { id: 'property-id' },
      data: {
        verificationStatus: VerificationStatus.submitted,
        published: false,
      },
    });
  });

  it('does not allow an approved property to be resubmitted and unpublished', async () => {
    const { prisma, service } = createService();
    prisma.property.findUnique = vi.fn().mockResolvedValue({
      id: 'property-id',
      ownerId: owner.sub,
      verificationStatus: VerificationStatus.approved,
    });

    await expect(
      service.submitVerification('property-id', owner),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(prisma.property.update).not.toHaveBeenCalled();
  });
});
