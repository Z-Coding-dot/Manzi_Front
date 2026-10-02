import { Controller, Get, Inject, Patch, UseGuards } from '@nestjs/common';
import { ValidatedBody } from '../common/decorators/validated-input.decorator.js';
import { UpdateProfileDto } from './update-profile.dto.js';

import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import type { AuthenticatedUser } from '../common/types/authenticated-user.js';
import { UsersService } from './users.service.js';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('customer', 'property_owner', 'property_manager', 'receptionist', 'property_staff', 'verification_agent', 'support_agent', 'finance_agent', 'content_manager', 'admin', 'super_admin')
export class UsersController {
  constructor(@Inject(UsersService) private usersService: UsersService) {}

  @Get('me')
  me(@CurrentUser() user: AuthenticatedUser) {
    return this.usersService.findMe(user.sub);
  }

  @Patch('me')
  updateMe(@ValidatedBody(UpdateProfileDto) dto: UpdateProfileDto, @CurrentUser() user: AuthenticatedUser) {
    return this.usersService.updateMe(user.sub, dto);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles('admin', 'super_admin')
  findAll() {
    return this.usersService.findAllForAdmin();
  }
}
