import {
  ConflictException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { createHash, randomUUID } from 'crypto';
import type { SignOptions } from 'jsonwebtoken';
import type { Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service.js';
import type { LoginDto } from './dto/login.dto.js';
import type { RegisterDto } from './dto/register.dto.js';

const BCRYPT_ROUNDS = 12;

function asExpiry(value: string): SignOptions['expiresIn'] {
  return value as SignOptions['expiresIn'];
}

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

@Injectable()
export class AuthService {
  constructor(
    @Inject(PrismaService) private prisma: PrismaService,
    @Inject(JwtService) private jwt: JwtService,
    @Inject(ConfigService) private config: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      // Deliberately vague — do not reveal whether the email exists to an
      // unauthenticated caller beyond what's necessary for UX.
      throw new ConflictException('An account with this email already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        passwordHash,
        role: dto.role ?? 'customer',
        language: dto.language ?? 'en',
      },
    });

    const tokens = await this.issueTokenPair(user.id, user.role);
    return { user: this.toPublicUser(user), ...tokens };
  }

  async login(
    dto: LoginDto,
    meta: { ipAddress?: string; deviceLabel?: string },
  ) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    // Compare against a dummy hash when the user doesn't exist so the
    // response time doesn't leak whether the email is registered.
    const passwordHash =
      user?.passwordHash ??
      '$2b$12$invalidsaltinvalidsaltinvalidsaltinvalidsaltinvalidsa';
    const passwordMatches = await bcrypt.compare(dto.password, passwordHash);

    if (!user || !passwordMatches) {
      throw new UnauthorizedException('Invalid email or password');
    }
    if (user.status !== 'active') {
      throw new UnauthorizedException('Account is not active');
    }

    const tokens = await this.issueTokenPair(user.id, user.role, meta);
    return { user: this.toPublicUser(user), ...tokens };
  }

  async refresh(refreshToken: string) {
    let payload: { sub: string };
    try {
      payload = await this.jwt.verifyAsync(refreshToken, {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const tokenHash = hashToken(refreshToken);
    return this.prisma.$transaction(async tx => {
    await tx.$queryRaw`SELECT id FROM refresh_tokens WHERE token_hash = ${tokenHash} FOR UPDATE`;
    const stored = await tx.refreshToken.findUnique({
      where: { tokenHash },
    });

    if (!stored || stored.userId !== payload.sub || stored.revokedAt || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token is no longer valid');
    }

    const user = await tx.user.findUnique({
      where: { id: payload.sub },
    });
    if (!user || user.status !== 'active') {
      throw new UnauthorizedException('Account is no longer active');
    }

    // Rotation: the old token is revoked and replaced atomically, so a
    // stolen-and-reused old refresh token fails on its next use.
    const tokens = await this.issueTokenPair(user.id, user.role, undefined, tx);
    await tx.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    return { user: this.toPublicUser(user), ...tokens };
    });
  }

  async logout(refreshToken: string) {
    const tokenHash = hashToken(refreshToken);
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return { success: true };
  }

  private async issueTokenPair(
    userId: string,
    role: string,
    meta?: { ipAddress?: string; deviceLabel?: string },
    tx: Prisma.TransactionClient = this.prisma,
  ): Promise<TokenPair> {
    const accessToken = await this.jwt.signAsync(
      { sub: userId, role },
      {
        secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
        expiresIn: asExpiry(
          this.config.get<string>('JWT_ACCESS_EXPIRES_IN') ?? '15m',
        ),
      },
    );

    const refreshJti = randomUUID();
    const refreshExpiresIn =
      this.config.get<string>('JWT_REFRESH_EXPIRES_IN') ?? '30d';
    const refreshToken = await this.jwt.signAsync(
      { sub: userId, jti: refreshJti },
      {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
        expiresIn: asExpiry(refreshExpiresIn),
      },
    );

    await tx.refreshToken.create({
      data: {
        userId,
        tokenHash: hashToken(refreshToken),
        deviceLabel: meta?.deviceLabel,
        ipAddress: meta?.ipAddress,
        expiresAt: addDuration(new Date(), refreshExpiresIn),
      },
    });

    return { accessToken, refreshToken };
  }

  private toPublicUser(user: {
    id: string;
    name: string;
    email: string | null;
    role: string;
    language: string;
  }) {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      language: user.language,
    };
  }
}

/** Parses simple durations like "30d", "15m", "1h" into a future Date. */
function addDuration(from: Date, duration: string): Date {
  const match = /^(\d+)([smhd])$/.exec(duration);
  if (!match) return new Date(from.getTime() + 30 * 24 * 60 * 60 * 1000); // fallback: 30 days
  const value = Number(match[1]);
  const unitMs = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 }[
    match[2] as 's' | 'm' | 'h' | 'd'
  ];
  return new Date(from.getTime() + value * unitMs);
}
