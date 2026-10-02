import { Controller, Get, Inject, Param, ParseUUIDPipe, UseGuards } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { ReservationsService } from './reservations.service.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import type { AuthenticatedUser } from '../common/types/authenticated-user.js';
@Controller('properties')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('property_owner', 'property_manager', 'admin', 'super_admin')
export class PropertyStatsController {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService, @Inject(ReservationsService) private readonly reservations: ReservationsService) {}
  @Get(':id/stats')
  async stats(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthenticatedUser) {
    const property = await this.reservations.propertyScope(id, user);
    // Business day follows Kabul's fixed UTC+4:30 timezone.
    const today = new Date(new Date(Date.now() + 270 * 60000).toISOString().slice(0, 10));
    const tomorrow = new Date(today.getTime() + 86400000);
    const dayStartUtc = new Date(today.getTime() - 270 * 60000);
    const since = new Date(today.getTime() - 6 * 86400000);
    const [rooms, reservations, revenue, pendingPayments, pendingPayouts] = await this.prisma.$transaction([
      this.prisma.room.findMany({ where: { propertyId: id }, select: { id: true, status: true } }),
      this.prisma.reservation.findMany({ where: { propertyId: id, status: { in: ['confirmed', 'checked_in', 'checked_out'] }, checkOut: { gte: since } }, select: { roomId: true, checkIn: true, checkOut: true, status: true } }),
      this.prisma.payment.aggregate({ where: { propertyId: id, status: 'paid', currency: 'AFN', createdAt: { gte: dayStartUtc, lt: new Date(dayStartUtc.getTime() + 86400000) } }, _sum: { amount: true } }),
      this.prisma.payment.count({ where: { propertyId: id, status: 'pending' } }),
      this.prisma.payout.count({ where: { propertyId: id, status: 'pending' } }),
    ]);
    const trend = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(since.getTime() + i * 86400000);
      const occupied = new Set(reservations.filter(r => r.checkIn <= date && r.checkOut > date).map(r => r.roomId).filter(Boolean)).size;
      return { day: date.toISOString().slice(0, 10), occupancy: rooms.length ? Math.round(occupied * 100 / rooms.length) : 0 };
    });
    const housekeeping = Object.fromEntries(['available', 'dirty', 'cleaning', 'maintenance'].map(status => [status, rooms.filter(r => r.status === status).length]));
    return { property: property.name, arrivals: reservations.filter(r => r.checkIn >= today && r.checkIn < tomorrow && r.status === 'confirmed').length, departures: reservations.filter(r => r.checkOut >= today && r.checkOut < tomorrow && r.status === 'checked_in').length, inHouse: reservations.filter(r => r.status === 'checked_in').length, availableRooms: rooms.filter(r => r.status === 'available').length, occupancyRate: trend[6].occupancy, revenueToday: revenue._sum.amount ?? 0, pendingPayments, pendingPayouts, pendingReservations: await this.prisma.reservation.count({ where: { propertyId: id, status: 'pending' } }), housekeeping, trend };
  }
}
