import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service.js';
import type { UpdateProfileDto } from './update-profile.dto.js';
import type {
  ConsolePreferencesDto,
  UpdatePasswordDto,
} from './account.dto.js';
const PROFILE_SELECT = {
  id: true,
  name: true,
  email: true,
  phone: true,
  role: true,
  language: true,
  currency: true,
  avatar: true,
  consolePreferences: true,
  createdAt: true,
} as const;
@Injectable()
export class UsersService {
  constructor(@Inject(PrismaService) private prisma: PrismaService) {}
  async updateMe(userId: string, data: UpdateProfileDto) {
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id: userId },
        data: {
          ...data,
          ...(data.email ? { email: data.email.trim().toLowerCase() } : {}),
        },
        select: PROFILE_SELECT,
      });
      await tx.auditLog.create({
        data: {
          actorId: userId,
          entityType: 'User',
          entityId: userId,
          action: 'profile_update',
          metadata: { fields: Object.keys(data) },
        },
      });
      return user;
    });
  }
  async updateAvatar(userId: string, avatar: string | null) {
    if (avatar !== null) {
      const match =
        /^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/]+={0,2})$/.exec(
          avatar,
        );
      if (!match)
        throw new BadRequestException('Use a PNG, JPEG or WebP image');
      const bytes = Buffer.from(match[2], 'base64');
      const valid =
        match[1] === 'png'
          ? bytes
              .subarray(0, 8)
              .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
          : match[1] === 'jpeg'
            ? bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
            : bytes.toString('ascii', 0, 4) === 'RIFF' &&
              bytes.toString('ascii', 8, 12) === 'WEBP';
      if (!valid || bytes.length > 150000 || bytes.length < 12)
        throw new BadRequestException('Invalid or oversized profile image');
    }
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id: userId },
        data: { avatar },
        select: PROFILE_SELECT,
      });
      await tx.auditLog.create({
        data: {
          actorId: userId,
          entityType: 'User',
          entityId: userId,
          action: 'avatar_update',
          metadata: { removed: avatar === null },
        },
      });
      return user;
    });
  }
  async updatePreferences(userId: string, data: ConsolePreferencesDto) {
    const { language, currency, ...preferences } = data;
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id: userId },
        data: { language, currency, consolePreferences: preferences },
        select: PROFILE_SELECT,
      });
      await tx.auditLog.create({
        data: {
          actorId: userId,
          entityType: 'User',
          entityId: userId,
          action: 'preferences_update',
          metadata: { fields: Object.keys(data) },
        },
      });
      return user;
    });
  }
  async updatePassword(userId: string, data: UpdatePasswordDto) {
    if (
      Buffer.byteLength(data.newPassword, 'utf8') > 72 ||
      Buffer.byteLength(data.currentPassword, 'utf8') > 72
    )
      throw new BadRequestException('Password must not exceed 72 bytes');
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true },
    });
    if (
      !user ||
      !(await bcrypt.compare(data.currentPassword, user.passwordHash))
    )
      throw new BadRequestException('Current password is incorrect');
    if (data.currentPassword === data.newPassword)
      throw new BadRequestException('Choose a different password');
    const passwordHash = await bcrypt.hash(data.newPassword, 12);
    return this.prisma.$transaction(async (tx) => {
      const changed = await tx.user.updateMany({
        where: { id: userId, passwordHash: user.passwordHash },
        data: { passwordHash, tokenVersion: { increment: 1 } },
      });
      if (changed.count !== 1)
        throw new ConflictException(
          'Password changed during this request; sign in again',
        );
      await tx.refreshToken.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      await tx.auditLog.create({
        data: {
          actorId: userId,
          entityType: 'User',
          entityId: userId,
          action: 'password_update',
        },
      });
      return { success: true };
    });
  }
  async findMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: PROFILE_SELECT,
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }
  findAllForAdmin() {
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
