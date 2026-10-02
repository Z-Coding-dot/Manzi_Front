import { ValidatedBody } from '../common/decorators/validated-input.decorator.js';
import { Controller, Get, Inject, Param, ParseUUIDPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import type { AuthenticatedUser } from '../common/types/authenticated-user.js';
import { CashPaymentDto, ModerateReviewDto, PayoutDto, ReviewDto, ReviewResponseDto, TicketDto, TicketUpdateDto, HousekeepingUpdateDto, MaintenanceCreateDto, MaintenanceUpdateDto } from './operations.dto.js';
import { OperationsService } from './operations.service.js';
@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('customer', 'property_owner', 'property_manager', 'receptionist', 'property_staff', 'admin', 'super_admin')
export class OperationsController {
  constructor(@Inject(OperationsService) private readonly service: OperationsService) {}
  @Get('properties/:id/housekeeping') @Roles('property_owner', 'property_manager', 'receptionist', 'property_staff', 'admin', 'super_admin') housekeeping(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() u: AuthenticatedUser) { return this.service.housekeeping(id, u); }
  @Patch('housekeeping/:id') @Roles('property_owner', 'property_manager', 'receptionist', 'property_staff', 'admin', 'super_admin') clean(@Param('id', ParseUUIDPipe) id: string, @ValidatedBody(HousekeepingUpdateDto) dto: HousekeepingUpdateDto, @CurrentUser() u: AuthenticatedUser) { return this.service.housekeepingStatus(id, dto, u); }
  @Get('properties/:id/maintenance') @Roles('property_owner', 'property_manager', 'receptionist', 'property_staff', 'admin', 'super_admin') maintenance(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() u: AuthenticatedUser) { return this.service.maintenance(id, u); }
  @Post('properties/:id/maintenance') @Roles('property_owner', 'property_manager', 'receptionist', 'property_staff', 'admin', 'super_admin') report(@Param('id', ParseUUIDPipe) id: string, @ValidatedBody(MaintenanceCreateDto) dto: MaintenanceCreateDto, @CurrentUser() u: AuthenticatedUser) { return this.service.createMaintenance(id, dto, u); }
  @Patch('maintenance/:id') @Roles('property_owner', 'property_manager', 'receptionist', 'property_staff', 'admin', 'super_admin') repair(@Param('id', ParseUUIDPipe) id: string, @ValidatedBody(MaintenanceUpdateDto) dto: MaintenanceUpdateDto, @CurrentUser() u: AuthenticatedUser) { return this.service.maintenanceStatus(id, dto, u); }
  @Get('properties/:id/payments') @Roles('property_owner', 'property_manager', 'receptionist', 'admin', 'super_admin') propertyPayments(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() u: AuthenticatedUser) { return this.service.propertyPayments(id, u); }
  @Get('reservations/:id/payments') payments(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() u: AuthenticatedUser) { return this.service.payments(id, u); }
  @Post('reservations/:id/payments') @Roles('property_owner', 'property_manager', 'receptionist', 'admin', 'super_admin') cashPayment(@Param('id', ParseUUIDPipe) id: string, @ValidatedBody(CashPaymentDto) dto: CashPaymentDto, @CurrentUser() u: AuthenticatedUser) { return this.service.cashPayment(id, dto, u); }
  @Get('payouts') @Roles('property_owner', 'admin', 'super_admin') payouts(@CurrentUser() u: AuthenticatedUser) { return this.service.payouts(u); }
  @Post('payouts') @Roles('admin', 'super_admin') createPayout(@ValidatedBody(PayoutDto) dto: PayoutDto, @CurrentUser() u: AuthenticatedUser) { return this.service.createPayout(dto, u); }
  @Post('payouts/:id/approve') @Roles('admin', 'super_admin') approve(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() u: AuthenticatedUser) { return this.service.payoutDecision(id, true, u); }
  @Post('payouts/:id/reject') @Roles('admin', 'super_admin') reject(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() u: AuthenticatedUser) { return this.service.payoutDecision(id, false, u); }
  @Get('support-tickets') tickets(@CurrentUser() u: AuthenticatedUser) { return this.service.tickets(u); }
  @Post('support-tickets') createTicket(@ValidatedBody(TicketDto) dto: TicketDto, @CurrentUser() u: AuthenticatedUser) { return this.service.createTicket(dto, u); }
  @Patch('support-tickets/:id') @Roles('admin', 'super_admin') updateTicket(@Param('id', ParseUUIDPipe) id: string, @ValidatedBody(TicketUpdateDto) dto: TicketUpdateDto, @CurrentUser() u: AuthenticatedUser) { return this.service.updateTicket(id, dto, u); }
  @Get('admin/reviews') @Roles('admin', 'super_admin') reviews() { return this.service.reviews(); }
  @Post('reservations/:id/reviews') @Roles('customer') createReview(@Param('id', ParseUUIDPipe) id: string, @ValidatedBody(ReviewDto) dto: ReviewDto, @CurrentUser() u: AuthenticatedUser) { return this.service.createReview(id, dto, u); }
  @Patch('admin/reviews/:id') @Roles('admin', 'super_admin') moderate(@Param('id', ParseUUIDPipe) id: string, @ValidatedBody(ModerateReviewDto) dto: ModerateReviewDto, @CurrentUser() u: AuthenticatedUser) { return this.service.moderateReview(id, dto.status, u); }
  @Patch('reviews/:id/response') @Roles('property_owner', 'admin', 'super_admin') response(@Param('id', ParseUUIDPipe) id: string, @ValidatedBody(ReviewResponseDto) dto: ReviewResponseDto, @CurrentUser() u: AuthenticatedUser) { return this.service.respondReview(id, dto.ownerResponse, u); }
}

