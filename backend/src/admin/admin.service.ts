import * as bcrypt from 'bcrypt';
import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, UserRole, UserStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import type { AuthenticatedUser } from '../common/types/authenticated-user.js';

@Injectable()
export class AdminService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async stats() {
    const since = new Date(Date.now() - 30 * 86_400_000);
    const [
      totalProperties,
      publishedProperties,
      activeReservations,
      revenue,
      newUsers,
      pendingProperties,
      flaggedReviews,
      openTickets,
      pendingPayouts,
    ] = await this.prisma.$transaction([
      this.prisma.property.count(),
      this.prisma.property.count({
        where: { published: true, verificationStatus: 'approved' },
      }),
      this.prisma.reservation.count({
        where: { status: { in: ['confirmed', 'checked_in'] } },
      }),
      this.prisma.payment.groupBy({
        by: ['currency'],
        where: { status: 'paid', createdAt: { gte: since } },
        _sum: { amount: true },
      }),
      this.prisma.user.count({ where: { createdAt: { gte: since } } }),
      this.prisma.property.count({
        where: { verificationStatus: { in: ['submitted', 'under_review'] } },
      }),
      this.prisma.review.count({
        where: { status: { in: ['pending', 'flagged'] } },
      }),
      this.prisma.supportTicket.count({
        where: { status: { in: ['open', 'investigating', 'waiting'] } },
      }),
      this.prisma.payout.count({ where: { status: 'pending' } }),
    ]);
    return {
      totalProperties,
      publishedProperties,
      activeReservations,
      gmv: revenue.map((r) => ({
        currency: r.currency,
        amount: r._sum.amount ?? 0,
      })),
      newUsers,
      pendingProperties,
      flaggedReviews,
      openTickets,
      pendingPayouts,
      periodStart: since.toISOString(),
    };
  }

  async createUser(
    data: {
      name: string;
      email: string;
      password: string;
      role: UserRole;
      phone?: string;
    },
    actor: AuthenticatedUser,
  ) {
    if (
      actor.role !== 'super_admin' &&
      ![
        'customer',
        'property_owner',
        'property_manager',
        'receptionist',
        'property_staff',
      ].includes(data.role)
    )
      throw new ForbiddenException(
        'Super administrator required to create platform staff',
      );
    if (Buffer.byteLength(data.password, 'utf8') > 72)
      throw new BadRequestException('Password must not exceed 72 bytes');
    const passwordHash = await bcrypt.hash(data.password, 12);
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: data.name,
          email: data.email.trim().toLowerCase(),
          passwordHash,
          role: data.role,
          phone: data.phone,
        },
        select: { id: true, name: true, email: true, role: true, status: true },
      });
      await tx.auditLog.create({
        data: {
          actorId: actor.sub,
          entityType: 'User',
          entityId: user.id,
          action: 'create',
          metadata: { role: user.role },
        },
      });
      return user;
    });
  }

  async users(search?: string) {
    return this.prisma.user.findMany({
      where: search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {},
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async updateUser(
    id: string,
    data: {
      role?: UserRole;
      status?: UserStatus;
      name?: string;
      email?: string;
      phone?: string;
    },
    actor: AuthenticatedUser,
  ) {
    if (!Object.keys(data).length)
      throw new BadRequestException('Choose fields to update');
    if (id === actor.sub)
      throw new BadRequestException(
        'Use another administrator to change your own access',
      );
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id } });
      if (!user) throw new NotFoundException('User not found');
      if (
        actor.role !== 'super_admin' &&
        (data.role || ['admin', 'super_admin'].includes(user.role))
      )
        throw new ForbiddenException('Super administrator required');
      const updated = await tx.user.update({
        where: { id },
        data,
        select: { id: true, name: true, email: true, role: true, status: true },
      });
      await tx.refreshToken.updateMany({
        where: { userId: id, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      await tx.auditLog.create({
        data: {
          actorId: actor.sub,
          entityType: 'User',
          entityId: id,
          action: 'update',
          metadata: {
            before: { role: user.role, status: user.status },
            after: data,
          },
        },
      });
      return updated;
    });
  }

  auditLogs(filters: {
    actorId?: string;
    entityType?: string;
    from?: string;
    to?: string;
    cursor?: string;
  }) {
    const where: Prisma.AuditLogWhereInput = {
      actorId: filters.actorId,
      entityType: filters.entityType,
    };
    if (filters.from || filters.to)
      where.createdAt = {
        gte: filters.from ? new Date(filters.from) : undefined,
        lte: filters.to ? new Date(filters.to) : undefined,
      };
    return this.prisma.auditLog.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: 100,
      ...(filters.cursor ? { cursor: { id: filters.cursor }, skip: 1 } : {}),
      include: { actor: { select: { id: true, name: true } } },
    });
  }
}
