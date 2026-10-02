import {
  ValidatedBody,
  ValidatedQuery,
} from '../common/decorators/validated-input.decorator.js';
import {
  Controller,
  Delete,
  Get,
  Post,
  Inject,
  Param,
  ParseUUIDPipe,
  Patch,
  UseGuards,
} from '@nestjs/common';
import {
  IsPhoneNumber,
  IsEmail,
  MinLength,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { UserRole, UserStatus } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import type { AuthenticatedUser } from '../common/types/authenticated-user.js';
import { AdminService } from './admin.service.js';

export class CreateAdminUserDto {
  @IsString() @MinLength(2) @MaxLength(100) name!: string;
  @IsEmail() @MaxLength(160) email!: string;
  @IsString() @MinLength(8) @MaxLength(72) password!: string;
  @IsEnum(UserRole) role!: UserRole;
  @IsOptional() @IsPhoneNumber() phone?: string;
}
export class UpdateAdminUserDto {
  @IsOptional() @IsString() @MinLength(2) @MaxLength(100) name?: string;
  @IsOptional() @IsEmail() @MaxLength(160) email?: string;
  @IsOptional() @IsPhoneNumber() phone?: string;
  @IsOptional() @IsEnum(UserRole) role?: UserRole;
  @IsOptional() @IsEnum(UserStatus) status?: UserStatus;
}
export class UserSearchDto {
  @IsOptional() @IsString() @MaxLength(120) search?: string;
}
export class AuditQueryDto {
  @IsOptional() @IsUUID() actorId?: string;
  @IsOptional() @IsString() @MaxLength(80) entityType?: string;
  @IsOptional() @IsDateString() from?: string;
  @IsOptional() @IsDateString() to?: string;
  @IsOptional() @IsUUID() cursor?: string;
}

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'super_admin')
export class AdminController {
  constructor(@Inject(AdminService) private readonly admin: AdminService) {}
  @Get('stats') stats() {
    return this.admin.stats();
  }
  @Get('users') users(@ValidatedQuery(UserSearchDto) query: UserSearchDto) {
    return this.admin.users(query.search);
  }
  @Patch('users/:id') updateUser(
    @Param('id', ParseUUIDPipe) id: string,
    @ValidatedBody(UpdateAdminUserDto) dto: UpdateAdminUserDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.admin.updateUser(id, dto, actor);
  }
  @Post('users') createUser(
    @ValidatedBody(CreateAdminUserDto) dto: CreateAdminUserDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.admin.createUser(dto, actor);
  }
  @Delete('users/:id') @Roles('super_admin') deactivateUser(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.admin.updateUser(id, { status: 'suspended' }, actor);
  }
  @Get('audit-logs') auditLogs(
    @ValidatedQuery(AuditQueryDto) query: AuditQueryDto,
  ) {
    return this.admin.auditLogs(query);
  }
}
