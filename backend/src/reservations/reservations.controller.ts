import { ValidatedBody } from '../common/decorators/validated-input.decorator.js';
import { Controller, Delete, Get, Inject, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import type { AuthenticatedUser } from '../common/types/authenticated-user.js';
import { CreateGuestDto, CreateReservationDto, ExtendReservationDto, LinkGuestDto, UpdateGuestDto } from './dto/create-reservation.dto.js';
import { ReservationsService } from './reservations.service.js';

@Controller('reservations')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('customer', 'property_owner', 'property_manager', 'receptionist', 'admin', 'super_admin')
export class ReservationsController {
  constructor(@Inject(ReservationsService) private readonly service: ReservationsService) {}
  @Get() list(@CurrentUser() user: AuthenticatedUser, @Query('propertyId', new ParseUUIDPipe({ optional: true })) propertyId?: string) { return this.service.list(user, propertyId); }
  @Get(':id') one(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthenticatedUser) { return this.service.one(id, user); }
  @Post() create(@ValidatedBody(CreateReservationDto) dto: CreateReservationDto, @CurrentUser() user: AuthenticatedUser) { return this.service.create(dto, user); }
  @Post(':id/guests') @Roles('property_owner', 'property_manager', 'receptionist', 'admin', 'super_admin') linkGuest(@Param('id', ParseUUIDPipe) id: string, @ValidatedBody(LinkGuestDto) dto: LinkGuestDto, @CurrentUser() user: AuthenticatedUser) { return this.service.linkGuest(id, dto.guestId, user); }
  @Delete(':id/guests/:guestId') @Roles('property_owner', 'property_manager', 'receptionist', 'admin', 'super_admin') unlinkGuest(@Param('id', ParseUUIDPipe) id: string, @Param('guestId', ParseUUIDPipe) guestId: string, @CurrentUser() user: AuthenticatedUser) { return this.service.linkGuest(id, guestId, user, true); }
  @Post(':id/check-in') @Roles('property_owner', 'property_manager', 'receptionist', 'admin', 'super_admin') checkIn(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthenticatedUser) { return this.service.transition(id, 'checked_in', user); }
  @Post(':id/check-out') @Roles('property_owner', 'property_manager', 'receptionist', 'admin', 'super_admin') checkOut(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthenticatedUser) { return this.service.transition(id, 'checked_out', user); }
  @Post(':id/cancel') cancel(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthenticatedUser) { return this.service.transition(id, 'cancelled', user); }
  @Patch(':id') @Roles('property_owner', 'property_manager', 'receptionist', 'admin', 'super_admin') extend(@Param('id', ParseUUIDPipe) id: string, @ValidatedBody(ExtendReservationDto) dto: ExtendReservationDto, @CurrentUser() user: AuthenticatedUser) { return this.service.extend(id, dto.checkOut, user); }
}
@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('property_owner', 'property_manager', 'receptionist', 'admin', 'super_admin')
export class GuestsController {
  constructor(@Inject(ReservationsService) private readonly service: ReservationsService) {}
  @Get('properties/:id/guests') list(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthenticatedUser) { return this.service.guests(id, user); }
  @Post('guests') create(@ValidatedBody(CreateGuestDto) dto: CreateGuestDto, @CurrentUser() user: AuthenticatedUser) { return this.service.createGuest(dto, user); }
  @Get('guests/:id') one(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthenticatedUser) { return this.service.guest(id, user); }
  @Patch('guests/:id') update(@Param('id', ParseUUIDPipe) id: string, @ValidatedBody(UpdateGuestDto) dto: UpdateGuestDto, @CurrentUser() user: AuthenticatedUser) { return this.service.updateGuest(id, dto, user); }
}

