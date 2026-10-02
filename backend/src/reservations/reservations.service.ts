import { BadRequestException, ConflictException, ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, type ReservationStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import type { AuthenticatedUser } from '../common/types/authenticated-user.js';
import type { CreateGuestDto, CreateReservationDto, UpdateGuestDto } from './dto/create-reservation.dto.js';

const admin = (u: AuthenticatedUser) => ['admin', 'super_admin'].includes(u.role);
const active: ReservationStatus[] = ['draft', 'pending', 'payment_pending', 'confirmed', 'checked_in'];
const include = { room: true, property: { select: { name: true, slug: true } }, guests: { include: { guest: { select: { id: true, name: true, phone: true } } } } } as const;

@Injectable()
export class ReservationsService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}
  async propertyScope(id: string, user: AuthenticatedUser, tx: Prisma.TransactionClient = this.prisma) {
    const property = await tx.property.findUnique({ where: { id }, include: { staff: { where: { userId: user.sub, status: 'active' } } } });
    if (!property) throw new NotFoundException('Property not found');
    if (!admin(user) && property.ownerId !== user.sub && !property.staff.length) throw new ForbiddenException('Property access denied');
    return property;
  }
  async list(user: AuthenticatedUser, propertyId?: string) {
    if (propertyId && user.role !== 'customer') await this.propertyScope(propertyId, user);
    const where: Prisma.ReservationWhereInput = user.role === 'customer' ? { customerId: user.sub } : admin(user) ? {} : { property: { OR: [{ ownerId: user.sub }, { staff: { some: { userId: user.sub, status: 'active' } } }] } };
    return this.prisma.reservation.findMany({ where: { ...where, ...(propertyId ? { propertyId } : {}) }, include, orderBy: { createdAt: 'desc' }, take: 250 });
  }
  async one(id: string, user: AuthenticatedUser, tx: Prisma.TransactionClient = this.prisma) {
    const reservation = await tx.reservation.findUnique({ where: { id }, include });
    if (!reservation) throw new NotFoundException('Reservation not found');
    if (user.role === 'customer') { if (reservation.customerId !== user.sub) throw new ForbiddenException('Reservation access denied'); }
    else await this.propertyScope(reservation.propertyId, user, tx);
    return reservation;
  }
  async create(dto: CreateReservationDto, user: AuthenticatedUser) {
    const checkIn = new Date(dto.checkIn), checkOut = new Date(dto.checkOut);
    const nights = (checkOut.getTime() - checkIn.getTime()) / 86_400_000;
    if (!Number.isInteger(nights) || nights < 1 || nights > 365) throw new BadRequestException('Choose valid dates between 1 and 365 nights');
    return this.prisma.$transaction(async tx => {
      // Serialize competing room and bed bookings, including a whole-room booking against a bed booking.
      await tx.$queryRaw`SELECT id FROM rooms WHERE id = ${dto.roomId} FOR UPDATE`;
      const room = await tx.room.findUnique({ where: { id: dto.roomId }, include: { property: true } });
      if (!room || room.propertyId !== dto.propertyId) throw new BadRequestException('Room does not belong to property');
      if (['maintenance', 'out_of_service'].includes(room.status)) throw new ConflictException('Room is not bookable');
      if (user.role === 'customer') {
        if (!room.property.published || room.property.verificationStatus !== 'approved') throw new ForbiddenException('Property is not published');
        if (dto.source !== 'marketplace' || dto.guestId) throw new BadRequestException('Invalid marketplace booking');
        if (checkIn < new Date(new Date(Date.now() + 270 * 60000).toISOString().slice(0, 10))) throw new BadRequestException('Check-in cannot be in the past');
      } else await this.propertyScope(dto.propertyId, user, tx);
      const bed = dto.bedId ? await tx.bed.findUnique({ where: { id: dto.bedId } }) : null;
      if (dto.bedId && (!bed || bed.roomId !== room.id || bed.status === 'maintenance')) throw new BadRequestException('Invalid bed');
      if (dto.guestsCount > (bed ? 1 : room.capacity)) throw new BadRequestException('Room capacity exceeded');
      await this.available(tx, room.id, dto.bedId, checkIn, checkOut);
      let guestId = dto.guestId;
      if (guestId) {
        const guest = await tx.guest.findUnique({ where: { id: guestId } });
        if (!guest || guest.propertyId !== dto.propertyId) throw new BadRequestException('Guest does not belong to property');
      } else {
        if (!dto.guestName?.trim() || !dto.guestPhone?.trim()) throw new BadRequestException('Guest name and phone required');
        guestId = (await tx.guest.create({ data: { name: dto.guestName.trim(), phone: dto.guestPhone.trim(), propertyId: dto.propertyId } })).id;
      }
      const total = (bed?.price ?? room.basePrice) * nights;
      if (!Number.isSafeInteger(total) || total > 2147483647) throw new BadRequestException('Booking total exceeds supported amount');
      const reservation = await tx.reservation.create({ data: { propertyId: dto.propertyId, roomId: room.id, bedId: bed?.id, customerId: user.role === 'customer' ? user.sub : undefined, checkIn, checkOut, guestsCount: dto.guestsCount, source: dto.source, status: 'confirmed', subtotal: total, total, guests: { create: { guestId } } }, include });
      await tx.auditLog.create({ data: { actorId: user.sub, entityType: 'Reservation', entityId: reservation.id, action: 'create' } });
      return reservation;
    });
  }
  async available(tx: Prisma.TransactionClient, roomId: string, bedId: string | undefined, checkIn: Date, checkOut: Date, exclude?: string) {
    const overlap = await tx.reservation.findFirst({ where: { roomId, status: { in: active }, checkIn: { lt: checkOut }, checkOut: { gt: checkIn }, ...(exclude ? { id: { not: exclude } } : {}), ...(bedId ? { OR: [{ bedId }, { bedId: null }] } : {}) } });
    if (overlap) throw new ConflictException('Selected accommodation is already booked for these dates');
  }
  async transition(id: string, status: 'checked_in' | 'checked_out' | 'cancelled', user: AuthenticatedUser) {
    return this.prisma.$transaction(async tx => {
      await tx.$queryRaw`SELECT id FROM reservations WHERE id = ${id} FOR UPDATE`;
      const reservation = await this.one(id, user, tx);
      const allowed = status === 'checked_in' ? ['confirmed'] : status === 'checked_out' ? ['checked_in'] : ['draft', 'pending', 'payment_pending', 'confirmed'];
      if (!allowed.includes(reservation.status)) throw new ConflictException('Invalid reservation transition');
      if (user.role === 'customer' && status !== 'cancelled') throw new ForbiddenException('Only property staff can check guests in or out');
      const updated = await tx.reservation.update({ where: { id }, data: { status }, include });
      if (reservation.bedId && status !== 'cancelled') await tx.bed.update({ where: { id: reservation.bedId }, data: { status: status === 'checked_in' ? 'occupied' : 'available' } });
      if (reservation.roomId && !reservation.bedId && status !== 'cancelled') await tx.room.update({ where: { id: reservation.roomId }, data: { status: status === 'checked_in' ? 'occupied' : 'dirty' } });
      if (reservation.roomId && !reservation.bedId && status === 'checked_out') await tx.housekeepingTask.create({ data: { roomId: reservation.roomId, propertyId: reservation.propertyId } });
      await tx.auditLog.create({ data: { actorId: user.sub, entityType: 'Reservation', entityId: id, action: status } });
      return updated;
    });
  }
  async extend(id: string, date: string, user: AuthenticatedUser) {
    return this.prisma.$transaction(async tx => {
      await tx.$queryRaw`SELECT id FROM reservations WHERE id = ${id} FOR UPDATE`;
      const reservation = await this.one(id, user, tx);
      if (!['confirmed', 'checked_in'].includes(reservation.status) || !reservation.roomId) throw new ConflictException('Reservation cannot be extended');
      await tx.$queryRaw`SELECT id FROM rooms WHERE id = ${reservation.roomId} FOR UPDATE`;
      const checkOut = new Date(date);
      const extraNights = (checkOut.getTime() - reservation.checkOut.getTime()) / 86_400_000;
      if (!Number.isInteger(extraNights) || extraNights < 1 || extraNights > 365) throw new BadRequestException('Choose a later check-out date');
      await this.available(tx, reservation.roomId, reservation.bedId ?? undefined, reservation.checkIn, checkOut, id);
      const bed = reservation.bedId ? await tx.bed.findUnique({ where: { id: reservation.bedId } }) : null;
      const extra = extraNights * (bed?.price ?? reservation.room!.basePrice);
      const updated = await tx.reservation.update({ where: { id }, data: { checkOut, subtotal: { increment: extra }, total: { increment: extra } }, include });
      await tx.auditLog.create({ data: { actorId: user.sub, entityType: 'Reservation', entityId: id, action: 'extend', metadata: { checkOut: date } } });
      return updated;
    });
  }
  async guests(propertyId: string, user: AuthenticatedUser) {
    await this.propertyScope(propertyId, user);
    return this.prisma.guest.findMany({ where: { propertyId }, select: { id: true, name: true, phone: true, email: true, nationality: true, idType: true, _count: { select: { reservations: true } } }, take: 250, orderBy: { createdAt: 'desc' } });
  }
  async createGuest(dto: CreateGuestDto, user: AuthenticatedUser) {
    await this.propertyScope(dto.propertyId, user);
    return this.prisma.guest.create({ data: dto, select: { id: true, name: true, phone: true, email: true, nationality: true, idType: true } });
  }
  async guest(id: string, user: AuthenticatedUser) {
    const guest = await this.prisma.guest.findUnique({ where: { id }, select: { id: true, propertyId: true, name: true, phone: true, email: true, nationality: true, idType: true } });
    if (!guest?.propertyId) throw new NotFoundException('Property guest not found');
    await this.propertyScope(guest.propertyId, user); return guest;
  }
  async updateGuest(id: string, dto: UpdateGuestDto, user: AuthenticatedUser) {
    await this.guest(id, user);
    return this.prisma.$transaction(async tx => {
      const guest = await tx.guest.update({ where: { id }, data: dto, select: { id: true, name: true, phone: true, email: true, nationality: true, idType: true } });
      await tx.auditLog.create({ data: { actorId: user.sub, entityType: 'Guest', entityId: id, action: 'update', metadata: { fields: Object.keys(dto) } } }); return guest;
    });
  }
  async linkGuest(id: string, guestId: string, user: AuthenticatedUser, remove = false) {
    return this.prisma.$transaction(async tx => {
      await tx.$queryRaw`SELECT id FROM reservations WHERE id = ${id} FOR UPDATE`;
      const reservation = await this.one(id, user, tx);
      if (!['draft', 'pending', 'payment_pending', 'confirmed', 'checked_in'].includes(reservation.status)) throw new ConflictException('Guest list is locked for this reservation');
      const guest = await tx.guest.findUnique({ where: { id: guestId } });
      if (!guest || guest.propertyId !== reservation.propertyId) throw new BadRequestException('Guest does not belong to property');
      const linked = reservation.guests.some(link => link.guest.id === guestId);
      if (remove) {
        if (!linked) throw new NotFoundException('Guest is not linked');
        if (reservation.guests.length <= 1) throw new ConflictException('Keep at least one principal guest');
        await tx.reservationGuest.delete({ where: { reservationId_guestId: { reservationId: id, guestId } } });
      } else {
        if (linked) return { success: true };
        if (reservation.guests.length >= reservation.guestsCount) throw new ConflictException('Reservation guest count exceeded');
        await tx.reservationGuest.create({ data: { reservationId: id, guestId } });
      }
      await tx.auditLog.create({ data: { actorId: user.sub, entityType: 'Reservation', entityId: id, action: remove ? 'guest_removed' : 'guest_linked', metadata: { guestId } } });
      return { success: true };
    });
  }
}
