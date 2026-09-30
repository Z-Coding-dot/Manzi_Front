import {
  ForbiddenException,
  Inject,
  Injectable,
  type CanActivate,
  type ExecutionContext,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import type { UserRole } from '@prisma/client';

import { ROLES_KEY } from '../decorators/roles.decorator.js';
import type { AuthenticatedUser } from '../types/authenticated-user.js';

/**
 * Enforces @Roles(...) metadata. Must run AFTER JwtAuthGuard in the guard
 * chain (Nest runs guards in the order they're declared) since it reads
 * request.user, which only JwtAuthGuard populates.
 *
 * This is the server-side counterpart to the frontend's permissions.ts —
 * that one is cosmetic UI gating; this one actually blocks the request.
 * A route with no @Roles() decorator is allowed for any authenticated user.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(@Inject(Reflector) private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<
      UserRole[] | undefined
    >(ROLES_KEY, [context.getHandler(), context.getClass()]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user: AuthenticatedUser | undefined = request.user;

    if (!user) {
      throw new ForbiddenException('Not authenticated');
    }

    if (!requiredRoles.includes(user.role)) {
      throw new ForbiddenException(
        `Role '${user.role}' is not permitted to perform this action`,
      );
    }

    return true;
  }
}
