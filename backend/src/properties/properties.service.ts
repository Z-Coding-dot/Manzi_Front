import {
  ConflictException,
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ReservationStatus,
  UserRole,
  VerificationStatus,
} from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service.js';
import type { AuthenticatedUser } from '../common/types/authenticated-user.js';
import type { CreateDocumentDto } from './dto/create-document.dto.js';
import type { CreatePropertyDto } from './dto/create-property.dto.js';
import type { CreateStaffDto } from './dto/create-staff.dto.js';
import type { PropertyReviewDecision } from './dto/review-property.dto.js';
import type { UpdatePropertyDto } from './dto/update-property.dto.js';
import type { UpdateStaffDto } from './dto/update-staff.dto.js';

const ADMIN_ROLES: UserRole[] = ['admin', 'super_admin'];
const REVIEWABLE_VERIFICATION_STATUSES: VerificationStatus[] = [
  VerificationStatus.submitted,
  VerificationStatus.under_review,
];
const SUBMITTABLE_VERIFICATION_STATUSES: VerificationStatus[] = [
  VerificationStatus.draft,
  VerificationStatus.changes_requested,
];
const ACTIVE_RESERVATION_STATUSES: ReservationStatus[] = [
  'draft',
  'pending',
  'payment_pending',
  'confirmed',
  'checked_in',
];

@Injectable()
export class PropertiesService {
  constructor(@Inject(PrismaService) private prisma: PrismaService) {}

  async findAll(user: AuthenticatedUser) {
    const where = (ADMIN_ROLES.includes(user.role) || user.role === 'verification_agent') ? {} : { OR: [{ ownerId: user.sub }, { staff: { some: { userId: user.sub, status: 'active' as const } } }] };
    return this.prisma.property.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { owner: { select: { id: true, name: true, email: true } }, _count: { select: { rooms: true, staff: true } } },
    });
  }

  async findPublished() {
    return this.prisma.property.findMany({
      where: {
        published: true,
        verificationStatus: VerificationStatus.approved,
      },
      include: {
        rooms: {
          where: { status: { notIn: ['maintenance', 'out_of_service'] } },
          orderBy: { basePrice: 'asc' },
        },
        amenities: { include: { amenity: true } },
        _count: { select: { reviews: true } },
      },
      orderBy: [{ rating: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async findPublishedBySlug(slug: string) {
    const property = await this.prisma.property.findFirst({
      where: {
        slug,
        published: true,
        verificationStatus: VerificationStatus.approved,
      },
      include: {
        rooms: {
          where: { status: { notIn: ['maintenance', 'out_of_service'] } },
          orderBy: { basePrice: 'asc' },
        },
        amenities: { include: { amenity: true } },
        reviews: {
          where: { status: 'published' },
          orderBy: { createdAt: 'desc' },
          take: 20,
          include: { customer: { select: { name: true } } },
        },
        _count: { select: { reviews: true } },
      },
    });
    if (!property) throw new NotFoundException('Published property not found');
    return property;
  }

  async findOne(id: string, user: AuthenticatedUser) {
    const property = await this.prisma.property.findUnique({
      where: { id },
      include: {
        documents: true,
        staff: {
          include: {
            user: { select: { id: true, name: true, email: true, role: true } },
          },
        },
        _count: { select: { rooms: true, reservations: true } },
      },
    });
    if (!property) throw new NotFoundException('Property not found');
    if (!ADMIN_ROLES.includes(user.role) && property.ownerId !== user.sub) {
      const membership = await this.prisma.propertyStaff.findFirst({ where: { propertyId: id, userId: user.sub, status: 'active' } });
      if (!membership) throw new ForbiddenException('You do not have access to this property');
      return { ...property, documents: [], staff: [] };
    }
    return property;
  }

  async create(dto: CreatePropertyDto, user: AuthenticatedUser) {
    const ownerId =
      ADMIN_ROLES.includes(user.role) && dto.ownerId ? dto.ownerId : user.sub;
    if (dto.ownerId && !ADMIN_ROLES.includes(user.role)) {
      throw new ForbiddenException(
        'Only admins can assign a different property owner',
      );
    }

    const owner = await this.prisma.user.findUnique({ where: { id: ownerId } });
    if (!owner) throw new NotFoundException('Property owner not found');
    if (
      owner.role !== UserRole.property_owner &&
      !ADMIN_ROLES.includes(owner.role)
    ) {
      throw new ConflictException(
        'Property owner must have an owner or admin role',
      );
    }

    return this.prisma.property.create({
      data: {
        name: dto.name,
        slug: dto.slug,
        type: dto.type,
        description: dto.description,
        address: dto.address,
        district: dto.district,
        latitude: dto.latitude,
        longitude: dto.longitude,
        phone: dto.phone,
        email: dto.email,
        checkInTime: dto.checkInTime,
        checkOutTime: dto.checkOutTime,
        languagesSpoken: dto.languagesSpoken ?? [],
        paymentMethods: dto.paymentMethods ?? [],
        policies: dto.policies,
        photos: dto.photos ?? [],
        ownerId,
      },
    });
  }

  async update(id: string, dto: UpdatePropertyDto, user: AuthenticatedUser) {
    const property = await this.getManagedProperty(id, user);
    const { ownerId: requestedOwnerId, ...data } = dto;
    if (
      requestedOwnerId &&
      requestedOwnerId !== property.ownerId &&
      !ADMIN_ROLES.includes(user.role)
    ) {
      throw new ForbiddenException(
        'Only admins can transfer property ownership',
      );
    }

    return this.prisma.property.update({
      where: { id },
      data: {
        ...data,
        ...(requestedOwnerId ? { ownerId: requestedOwnerId } : {}),
      },
    });
  }

  async remove(id: string, user: AuthenticatedUser) {
    await this.getManagedProperty(id, user);
    const activeReservations = await this.prisma.reservation.count({
      where: { propertyId: id, status: { in: ACTIVE_RESERVATION_STATUSES } },
    });
    if (activeReservations > 0) {
      throw new ConflictException(
        'Cannot suspend a property with active reservations',
      );
    }

    return this.prisma.property.update({
      where: { id },
      data: {
        published: false,
        verificationStatus: VerificationStatus.suspended,
      },
    });
  }

  async submitVerification(id: string, user: AuthenticatedUser) {
    const property = await this.getManagedProperty(id, user);
    if (
      !SUBMITTABLE_VERIFICATION_STATUSES.includes(property.verificationStatus)
    ) {
      throw new ConflictException('Property is not ready for submission');
    }
    return this.prisma.property.update({
      where: { id: property.id },
      data: {
        verificationStatus: VerificationStatus.submitted,
        published: false,
      },
    });
  }

  async review(
    id: string,
    status: PropertyReviewDecision,
    user: AuthenticatedUser,
    notes?: string,
  ) {
    if (!ADMIN_ROLES.includes(user.role) && user.role !== 'verification_agent') {
      throw new ForbiddenException('Only verification staff can review properties');
    }

    return this.prisma.$transaction(async tx => {
    const result = await tx.property.updateMany({
      where: {
        id,
        verificationStatus: { in: REVIEWABLE_VERIFICATION_STATUSES },
      },
      data: {
        verificationStatus: status,
        published: status === VerificationStatus.approved,
        ...(notes !== undefined ? { reviewNotes: notes } : {}),
      },
    });

    if (result.count === 0) {
      const property = await tx.property.findUnique({
        where: { id },
        select: { id: true },
      });
      if (!property) throw new NotFoundException('Property not found');
      throw new ConflictException('Property is not awaiting review');
    }

    const property = await tx.property.findUniqueOrThrow({ where: { id } });
    await tx.auditLog.create({ data: { actorId: user.sub, entityType: 'Property', entityId: id, action: 'review', metadata: { status, notes: notes ?? '' } } });
    await tx.notification.create({ data: { userId: property.ownerId, type: 'system', title: 'Property review completed', body: `${property.name}: ${status}${notes ? ` — ${notes}` : ''}` } });
    return property;
    });
  }

  async listDocuments(id: string, user: AuthenticatedUser) {
    await this.getManagedProperty(id, user);
    return this.prisma.propertyDocument.findMany({
      where: { propertyId: id },
      orderBy: { createdAt: 'desc' },
    });
  }

  async addDocument(
    id: string,
    dto: CreateDocumentDto,
    user: AuthenticatedUser,
  ) {
    await this.getManagedProperty(id, user);
    return this.prisma.propertyDocument.create({
      data: { propertyId: id, ...dto },
    });
  }

  async removeDocument(
    id: string,
    documentId: string,
    user: AuthenticatedUser,
  ) {
    await this.getManagedProperty(id, user);
    const document = await this.prisma.propertyDocument.findFirst({
      where: { id: documentId, propertyId: id },
    });
    if (!document) throw new NotFoundException('Property document not found');
    await this.prisma.propertyDocument.delete({ where: { id: documentId } });
    return { success: true };
  }

  async listStaff(id: string, user: AuthenticatedUser) {
    await this.getManagedProperty(id, user);
    return this.prisma.propertyStaff.findMany({
      where: { propertyId: id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async addStaff(id: string, dto: CreateStaffDto, user: AuthenticatedUser) {
    await this.getManagedProperty(id, user);
    if ((!dto.userId && !dto.phone) || (dto.userId && dto.phone)) throw new BadRequestException('Provide exactly one user ID or registered phone');
    const staffUser = await this.prisma.user.findUnique({
      where: dto.userId ? { id: dto.userId } : { phone: dto.phone! },
    });
    if (!staffUser) throw new NotFoundException('Staff user not found');
    const allowedStaffRoles: UserRole[] = [
      UserRole.property_manager,
      UserRole.receptionist,
      UserRole.property_staff,
    ];
    if (!allowedStaffRoles.includes(staffUser.role) || staffUser.role !== dto.role || staffUser.status !== 'active') {
      throw new ConflictException('User does not have a property staff role');
    }

    try {
      return await this.prisma.propertyStaff.create({
        data: { propertyId: id, userId: staffUser.id, role: dto.role },
        include: { user: { select: { name: true, phone: true } } },
      });
    } catch (error) {
      if (this.isUniqueViolation(error))
        throw new ConflictException(
          'User is already assigned to this property',
        );
      throw error;
    }
  }

  async updateStaff(
    id: string,
    staffId: string,
    dto: UpdateStaffDto,
    user: AuthenticatedUser,
  ) {
    await this.getManagedProperty(id, user);
    const staff = await this.prisma.propertyStaff.findFirst({
      where: { id: staffId, propertyId: id },
    });
    if (!staff) throw new NotFoundException('Property staff member not found');
    return this.prisma.propertyStaff.update({
      where: { id: staffId },
      data: dto,
    });
  }

  async removeStaff(id: string, staffId: string, user: AuthenticatedUser) {
    await this.getManagedProperty(id, user);
    const staff = await this.prisma.propertyStaff.findFirst({
      where: { id: staffId, propertyId: id },
    });
    if (!staff) throw new NotFoundException('Property staff member not found');
    await this.prisma.propertyStaff.delete({ where: { id: staffId } });
    return { success: true };
  }

  private async getManagedProperty(id: string, user: AuthenticatedUser) {
    const property = await this.prisma.property.findUnique({
      where: { id },
      select: { id: true, ownerId: true, verificationStatus: true },
    });
    if (!property) throw new NotFoundException('Property not found');
    this.assertCanManage(property.ownerId, user);
    return property;
  }

  private assertCanManage(ownerId: string, user: AuthenticatedUser) {
    if (!ADMIN_ROLES.includes(user.role) && ownerId !== user.sub) {
      throw new ForbiddenException('You do not have access to this property');
    }
  }

  private isUniqueViolation(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'P2002'
    );
  }
}
