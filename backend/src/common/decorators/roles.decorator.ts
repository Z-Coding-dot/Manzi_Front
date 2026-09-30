import { SetMetadata } from '@nestjs/common';

import type { UserRole } from '@prisma/client';

export const ROLES_KEY = 'roles';

/**
 * Marks a route/controller as restricted to specific roles. This is the
 * REAL authorization boundary — unlike the frontend's cosmetic role-based
 * nav hiding, this is enforced server-side on every request and cannot be
 * bypassed by editing client-side code.
 *
 * Usage: @Roles('property_owner', 'property_manager')
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
