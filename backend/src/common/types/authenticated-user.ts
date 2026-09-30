import type { UserRole } from '@prisma/client';

/**
 * Shape of the decoded JWT payload, attached to `request.user` by
 * JwtStrategy after signature verification. Never trust any field here
 * beyond what the strategy itself verified — this is not a place to add
 * unverified claims from the request body.
 */
export interface AuthenticatedUser {
  sub: string; // user id
  role: UserRole;
  email: string | null;
}
