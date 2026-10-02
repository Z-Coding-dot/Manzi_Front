import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service.js';
import type { UpdateProfileDto } from './update-profile.dto.js';

@Injectable()
export class UsersService {
  constructor(@Inject(PrismaService) private prisma: PrismaService) {}
  async updateMe(userId: string, data: UpdateProfileDto) {
    return this.prisma.$transaction(async tx => {
      const user = await tx.user.update({ where: { id: userId }, data, select: { id: true, name: true, email: true, phone: true, role: true, language: true, currency: true } });
      await tx.auditLog.create({ data: { actorId: userId, entityType: 'User', entityId: userId, action: 'profile_update', metadata: { fields: Object.keys(data) } } });
      return user;
    });
  }

  async findMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        language: true,
        currency: true,
        createdAt: true,
      },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async findAllForAdmin() {
    // Deliberately excludes passwordHash — never select it for any
    // response, admin included.
    return this.prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }
}
