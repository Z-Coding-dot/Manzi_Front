import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { PrismaService } from '../../prisma/prisma.service.js';
import type { AuthenticatedUser } from '../../common/types/authenticated-user.js';

interface AccessTokenPayload {
  sub: string;
  role: string;
  ver?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    @Inject(ConfigService) config: ConfigService,
    @Inject(PrismaService) private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_ACCESS_SECRET'),
    });
  }

  async validate(payload: AccessTokenPayload): Promise<AuthenticatedUser> {
    // Re-check the user still exists and isn't suspended on every request —
    // a stale-but-unexpired access token shouldn't keep working after an
    // account is suspended.
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });
    if (
      !user ||
      user.status !== 'active' ||
      (payload.ver ?? 0) !== user.tokenVersion
    ) {
      throw new UnauthorizedException('Account is no longer active');
    }

    return { sub: user.id, role: user.role, email: user.email };
  }
}
