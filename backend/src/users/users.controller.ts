import { Controller, Get, Inject, UseGuards } from '@nestjs/common';

import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import type { AuthenticatedUser } from '../common/types/authenticated-user.js';
import { UsersService } from './users.service.js';

@Controller('users')
@UseGuards(JwtAuthGuard) // every route below requires a valid access token
export class UsersController {
  constructor(@Inject(UsersService) private usersService: UsersService) {}

  @Get('me')
  me(@CurrentUser() user: AuthenticatedUser) {
    return this.usersService.findMe(user.sub);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles('admin', 'super_admin')
  findAll() {
    return this.usersService.findAllForAdmin();
  }
}
