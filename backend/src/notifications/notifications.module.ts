import { Controller, Get, Inject, Injectable, Module, Param, ParseUUIDPipe, Patch, UseGuards, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { PassportModule } from '@nestjs/passport';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import type { AuthenticatedUser } from '../common/types/authenticated-user.js';
@Injectable()
export class NotificationsService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}
  create(userId: string, type: string, title: string, body: string) { return this.prisma.notification.create({ data: { userId, type, title, body } }); }
  list(userId: string) { return this.prisma.notification.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 100 }); }
  async read(id: string, userId: string) {
    const result = await this.prisma.notification.updateMany({ where: { id, userId }, data: { readAt: new Date() } });
    if (!result.count) throw new NotFoundException('Notification not found');
    return { id };
  }
}
@Controller('notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('customer', 'property_owner', 'property_manager', 'receptionist', 'property_staff', 'verification_agent', 'support_agent', 'finance_agent', 'content_manager', 'admin', 'super_admin')
export class NotificationsController {
  constructor(@Inject(NotificationsService) private readonly service: NotificationsService) {}
  @Get() list(@CurrentUser() user: AuthenticatedUser) { return this.service.list(user.sub); }
  @Patch(':id/read') read(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthenticatedUser) { return this.service.read(id, user.sub); }
}
@Module({ imports: [PassportModule.register({ defaultStrategy: 'jwt' })], controllers: [NotificationsController], providers: [NotificationsService], exports: [NotificationsService] })
export class NotificationsModule {}
