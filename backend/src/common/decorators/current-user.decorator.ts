import { createParamDecorator, type ExecutionContext } from '@nestjs/common';

import type { AuthenticatedUser } from '../types/authenticated-user.js';

/**
 * Usage: findAll(@CurrentUser() user: AuthenticatedUser)
 * Only valid on routes behind JwtAuthGuard, which populates request.user.
 */
export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext): AuthenticatedUser => {
  const request = ctx.switchToHttp().getRequest();
  return request.user;
});
