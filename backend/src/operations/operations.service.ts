import { BadRequestException, ConflictException, ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { ReservationsService } from '../reservations/reservations.service.js';
import type { AuthenticatedUser } from '../common/types/authenticated-user.js';
import type { CashPaymentDto, PayoutDto, ReviewDto, TicketDto, TicketUpdateDto, MaintenanceCreateDto, HousekeepingUpdateDto, MaintenanceUpdateDto } from './operations.dto.js';
import { Prisma, type ReviewStatus } from '@prisma/client';
const admin = (u: AuthenticatedUser) => ['admin', 'super_admin'].includes(u.role);
@Injectable()
export class OperationsService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService, @Inject(ReservationsService) private readonly reservations: ReservationsService) {}
  async housekeeping(propertyId: string, user: AuthenticatedUser) {
    await this.reservations.propertyScope(propertyId, user);
    const tasks = await this.prisma.housekeepingTask.findMany({ where: { propertyId }, include: { room: { select: { roomNumber: true } } }, orderBy: { updatedAt: 'desc' }, take: 250 });
    return tasks.map(({ room, ...task }) => ({ ...task, roomNumber: room.roomNumber }));
  }
  async housekeepingStatus(id: string, dto: HousekeepingUpdateDto, user: AuthenticatedUser) {
    return this.prisma.$transaction(async tx => {
      await tx.$queryRaw`SELECT id FROM housekeeping_tasks WHERE id = ${id} FOR UPDATE`;
      const task = await tx.housekeepingTask.findUnique({ where: { id } });
      if (!task) throw new NotFoundException('Task not found');
      await this.reservations.propertyScope(task.propertyId, user, tx);
      const states = ['pending', 'in_progress', 'done', 'inspected'];
      if (states.indexOf(dto.status) !== states.indexOf(task.status) + 1) throw new ConflictException('Invalid housekeeping transition');
      await tx.$queryRaw`SELECT id FROM rooms WHERE id = ${task.roomId} FOR UPDATE`;
      const room = await tx.room.findUniqueOrThrow({ where: { id: task.roomId } });
      if (['occupied', 'maintenance', 'out_of_service'].includes(room.status)) throw new ConflictException('Room cannot be cleaned now');
      if (dto.status === 'inspected' && user.role === 'property_staff') throw new ForbiddenException('Manager inspection required');
      const actor = await tx.user.findUniqueOrThrow({ where: { id: user.sub }, select: { name: true } });
      const updated = await tx.housekeepingTask.update({ where: { id }, data: { status: dto.status, assignedTo: actor.name } });
      await tx.room.update({ where: { id: room.id }, data: { status: dto.status === 'inspected' ? 'available' : 'cleaning' } });
      await this.audit(tx, user.sub, 'HousekeepingTask', id, dto.status); return { id: updated.id };
    });
  }
  async maintenance(propertyId: string, user: AuthenticatedUser) {
    await this.reservations.propertyScope(propertyId, user);
    const issues = await this.prisma.maintenanceIssue.findMany({ where: { propertyId }, include: { room: { select: { roomNumber: true } } }, orderBy: { reportedAt: 'desc' }, take: 250 });
    return issues.map(({ room, ...issue }) => ({ ...issue, roomNumber: room.roomNumber }));
  }
  async createMaintenance(propertyId: string, dto: MaintenanceCreateDto, user: AuthenticatedUser) {
    return this.prisma.$transaction(async tx => {
      await this.reservations.propertyScope(propertyId, user, tx);
      const room = await tx.room.findUnique({ where: { propertyId_roomNumber: { propertyId, roomNumber: dto.roomNumber } } });
      if (!room) throw new BadRequestException('Choose a room in this property');
      const issue = await tx.maintenanceIssue.create({ data: { propertyId, roomId: room.id, title: dto.title, priority: dto.priority } });
      await this.audit(tx, user.sub, 'MaintenanceIssue', issue.id, 'create'); return { ...issue, roomNumber: room.roomNumber };
    });
  }
  async maintenanceStatus(id: string, dto: MaintenanceUpdateDto, user: AuthenticatedUser) {
    return this.prisma.$transaction(async tx => {
      await tx.$queryRaw`SELECT id FROM maintenance_issues WHERE id = ${id} FOR UPDATE`;
      const issue = await tx.maintenanceIssue.findUnique({ where: { id } });
      if (!issue) throw new NotFoundException('Issue not found');
      await this.reservations.propertyScope(issue.propertyId, user, tx);
      if (issue.status === 'resolved' || dto.status === 'open') throw new ConflictException('Invalid maintenance transition');
      await tx.maintenanceIssue.update({ where: { id }, data: dto });
      await this.audit(tx, user.sub, 'MaintenanceIssue', id, dto.status); return { id };
    });
  }
  async payments(id: string, user: AuthenticatedUser) { await this.reservations.one(id, user); return this.prisma.payment.findMany({ where: { reservationId: id }, orderBy: { createdAt: 'desc' } }); }
  async propertyPayments(id: string, user: AuthenticatedUser) {
    await this.reservations.propertyScope(id, user);
    const date = new Date(new Date(Date.now() + 270 * 60000).toISOString().slice(0, 10));
    const start = new Date(date.getTime() - 270 * 60000);
    const where = { propertyId: id, currency: 'AFN' as const, status: 'paid' as const, createdAt: { gte: start, lt: new Date(start.getTime() + 86400000) } };
    const [payments, sum] = await this.prisma.$transaction([
      this.prisma.payment.findMany({ where, orderBy: { createdAt: 'desc' }, take: 250 }),
      this.prisma.payment.aggregate({ where, _sum: { amount: true } }),
    ]);
    return { totalCollected: sum._sum.amount ?? 0, transactions: payments.map(payment => ({ id: payment.id, type: 'payment', method: payment.method, amount: payment.amount, reference: payment.reservationId, time: payment.createdAt })) };
  }
  async cashPayment(id: string, dto: CashPaymentDto, user: AuthenticatedUser) {
    return this.prisma.$transaction(async tx => {
      await tx.$queryRaw`SELECT id FROM reservations WHERE id = ${id} FOR UPDATE`;
      const reservation = await this.reservations.one(id, user, tx);
      const providerReference = `cash:${dto.idempotencyKey}`;
      const existing = await tx.payment.findUnique({ where: { providerReference } });
      if (existing) { if (existing.reservationId !== id || existing.amount !== dto.amount) throw new ConflictException('Payment key already used'); return existing; }
      if (!['confirmed', 'checked_in', 'checked_out'].includes(reservation.status)) throw new ConflictException('Reservation cannot accept a payment');
      const paid = await tx.payment.aggregate({ where: { reservationId: id, status: 'paid' }, _sum: { amount: true } });
      if ((paid._sum.amount ?? 0) + dto.amount > reservation.total) throw new BadRequestException('Payment exceeds outstanding balance');
      const payment = await tx.payment.create({ data: { reservationId: id, propertyId: reservation.propertyId, customerId: reservation.customerId, amount: dto.amount, currency: reservation.currency, method: 'cash', status: 'paid', providerReference } });
      await this.audit(tx, user.sub, 'Payment', payment.id, 'cash_received', { amount: dto.amount, currency: payment.currency }); return payment;
    });
  }
  payouts(user: AuthenticatedUser) { return this.prisma.payout.findMany({ where: admin(user) ? {} : { property: { ownerId: user.sub } }, include: { property: { select: { name: true } } }, orderBy: { createdAt: 'desc' }, take: 100 }); }
  async createPayout(dto: PayoutDto, user: AuthenticatedUser) {
    return this.prisma.$transaction(async tx => {
      await tx.$queryRaw`SELECT id FROM properties WHERE id = ${dto.propertyId} FOR UPDATE`;
      await this.reservations.propertyScope(dto.propertyId, user, tx);
      // Only electronically collected, settled funds can be paid out. Cash stays with the property.
      const received = await tx.payment.aggregate({ where: { propertyId: dto.propertyId, currency: dto.currency, method: { in: ['hesabpay', 'afpay'] }, status: 'paid' }, _sum: { amount: true } });
      const committed = await tx.payout.aggregate({ where: { propertyId: dto.propertyId, currency: dto.currency, status: { in: ['pending', 'processing', 'paid'] } }, _sum: { amount: true } });
      if (dto.amount > (received._sum.amount ?? 0) - (committed._sum.amount ?? 0)) throw new BadRequestException('Insufficient settled platform funds');
      const payout = await tx.payout.create({ data: dto });
      await this.audit(tx, user.sub, 'Payout', payout.id, 'create', { amount: dto.amount, currency: dto.currency }); return payout;
    });
  }
  async payoutDecision(id: string, approve: boolean, user: AuthenticatedUser) {
    return this.prisma.$transaction(async tx => {
      const changed = await tx.payout.updateMany({ where: { id, status: 'pending' }, data: { status: approve ? 'processing' : 'failed' } });
      if (!changed.count) throw new ConflictException('Payout is not awaiting approval');
      await this.audit(tx, user.sub, 'Payout', id, approve ? 'approve' : 'reject'); return tx.payout.findUniqueOrThrow({ where: { id } });
    });
  }
  tickets(user: AuthenticatedUser) { return this.prisma.supportTicket.findMany({ where: admin(user) ? {} : { userId: user.sub }, orderBy: { createdAt: 'desc' }, take: 100 }); }
  async createTicket(dto: TicketDto, user: AuthenticatedUser) {
    if (dto.reservationId) await this.reservations.one(dto.reservationId, user);
    return this.prisma.$transaction(async tx => { const ticket = await tx.supportTicket.create({ data: { ...dto, userId: user.sub } }); await this.audit(tx, user.sub, 'SupportTicket', ticket.id, 'create'); return ticket; });
  }
  async updateTicket(id: string, dto: TicketUpdateDto, user: AuthenticatedUser) {
    if (dto.assignedToId) { const assignee = await this.prisma.user.findUnique({ where: { id: dto.assignedToId } }); if (!assignee || assignee.status !== 'active' || !['admin', 'super_admin', 'support_agent'].includes(assignee.role)) throw new BadRequestException('Choose an active support agent'); }
    return this.prisma.$transaction(async tx => {
      const ticket = await tx.supportTicket.findUnique({ where: { id } }); if (!ticket) throw new NotFoundException('Ticket not found');
      const updated = await tx.supportTicket.update({ where: { id }, data: dto }); await this.audit(tx, user.sub, 'SupportTicket', id, 'update', dto as Prisma.InputJsonValue);
      if (dto.response) await tx.notification.create({ data: { userId: ticket.userId, type: 'support_response', title: ticket.subject, body: dto.response } });
      return updated;
    });
  }
  reviews() { return this.prisma.review.findMany({ orderBy: { createdAt: 'desc' }, include: { property: { select: { name: true } }, customer: { select: { name: true } } }, take: 100 }); }
  async createReview(id: string, dto: ReviewDto, user: AuthenticatedUser) {
    const reservation = await this.reservations.one(id, user);
    if (reservation.customerId !== user.sub || reservation.status !== 'checked_out') throw new ForbiddenException('Only the customer can review a completed stay');
    return this.prisma.$transaction(async tx => { const review = await tx.review.create({ data: { ...dto, reservationId: id, propertyId: reservation.propertyId, customerId: user.sub } }); await this.audit(tx, user.sub, 'Review', review.id, 'create'); return review; });
  }
  async moderateReview(id: string, status: ReviewStatus, user: AuthenticatedUser) {
    return this.prisma.$transaction(async tx => {
      const original = await tx.review.findUnique({ where: { id }, select: { propertyId: true } });
      if (!original) throw new NotFoundException('Review not found');
      await tx.$queryRaw`SELECT id FROM properties WHERE id = ${original.propertyId} FOR UPDATE`;
      const review = await tx.review.update({ where: { id }, data: { status } });
      const rating = await tx.review.aggregate({ where: { propertyId: review.propertyId, status: 'published' }, _avg: { overallRating: true } });
      await tx.property.update({ where: { id: review.propertyId }, data: { rating: rating._avg.overallRating ?? 0 } });
      await this.audit(tx, user.sub, 'Review', id, status); return review;
    });
  }
  async respondReview(id: string, ownerResponse: string, user: AuthenticatedUser) {
    const review = await this.prisma.review.findUnique({ where: { id } }); if (!review) throw new NotFoundException('Review not found');
    const property = await this.reservations.propertyScope(review.propertyId, user);
    if (!admin(user) && property.ownerId !== user.sub) throw new ForbiddenException('Only the owner can respond');
    return this.prisma.$transaction(async tx => { const updated = await tx.review.update({ where: { id }, data: { ownerResponse } }); await this.audit(tx, user.sub, 'Review', id, 'owner_response'); return updated; });
  }
  private audit(tx: Prisma.TransactionClient, actorId: string, entityType: string, entityId: string, action: string, metadata?: Prisma.InputJsonValue) { return tx.auditLog.create({ data: { actorId, entityType, entityId, action, metadata } }); }
}
