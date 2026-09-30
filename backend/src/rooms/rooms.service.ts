import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BedGender, BedStatus, UserRole } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service.js';
import type { AuthenticatedUser } from '../common/types/authenticated-user.js';
import type { CreateRoomDto } from './dto/create-room.dto.js';
import type { CreateBedDto } from './dto/create-bed.dto.js';
import type { UpdateBedDto } from './dto/update-bed.dto.js';
import type { UpdateRoomDto } from './dto/update-room.dto.js';

const ADMIN_ROLES: UserRole[] = ['admin', 'super_admin'];

@Injectable()
export class RoomsService {
  constructor(@Inject(PrismaService) private prisma: PrismaService) {}

  async findAll(propertyId: string, user: AuthenticatedUser) {
    await this.assertPropertyAccess(propertyId, user);
    return this.prisma.room.findMany({
      where: { propertyId },
      orderBy: { roomNumber: 'asc' },
      include: {
        beds: { orderBy: { bedNumber: 'asc' } },
        amenities: {
          include: { amenity: true },
          orderBy: { amenity: { name: 'asc' } },
        },
      },
    });
  }

  async findBeds(roomId: string, user: AuthenticatedUser) {
    await this.assertRoomAccess(roomId, user);
    return this.prisma.bed.findMany({
      where: { roomId },
      include: { room: { select: { id: true, roomNumber: true } } },
      orderBy: { bedNumber: 'asc' },
    });
  }

  async createBed(roomId: string, dto: CreateBedDto, user: AuthenticatedUser) {
    await this.assertRoomAccess(roomId, user);
    try {
      return await this.prisma.bed.create({
        data: {
          roomId,
          ...dto,
          gender: dto.gender ?? BedGender.any,
          status: dto.status ?? BedStatus.available,
        },
        include: { room: { select: { id: true, roomNumber: true } } },
      });
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        throw new ConflictException('Bed number already exists for this room');
      }
      throw error;
    }
  }

  async updateBed(id: string, dto: UpdateBedDto, user: AuthenticatedUser) {
    const bed = await this.prisma.bed.findUnique({
      where: { id },
      select: { id: true, roomId: true },
    });
    if (!bed) throw new NotFoundException('Bed not found');
    await this.assertRoomAccess(bed.roomId, user);
    try {
      return await this.prisma.bed.update({
        where: { id },
        data: dto,
        include: { room: { select: { id: true, roomNumber: true } } },
      });
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        throw new ConflictException('Bed number already exists for this room');
      }
      throw error;
    }
  }

  async removeBed(id: string, user: AuthenticatedUser) {
    const bed = await this.prisma.bed.findUnique({
      where: { id },
      select: { id: true, roomId: true },
    });
    if (!bed) throw new NotFoundException('Bed not found');
    await this.assertRoomAccess(bed.roomId, user);
    try {
      await this.prisma.bed.delete({ where: { id } });
    } catch (error) {
      if (this.isForeignKeyViolation(error)) {
        throw new ConflictException(
          'Cannot delete a bed linked to reservations',
        );
      }
      throw error;
    }
    return { success: true };
  }

  async findAmenities() {
    return this.prisma.amenity.findMany({ orderBy: { name: 'asc' } });
  }

  async findPropertyAmenities(propertyId: string, user: AuthenticatedUser) {
    await this.assertPropertyAccess(propertyId, user);
    return this.prisma.propertyAmenity.findMany({
      where: { propertyId },
      include: { amenity: true },
      orderBy: { amenity: { name: 'asc' } },
    });
  }

  async addPropertyAmenity(
    propertyId: string,
    amenityId: string,
    user: AuthenticatedUser,
  ) {
    await this.assertPropertyAccess(propertyId, user);
    await this.assertAmenityExists(amenityId);
    try {
      return await this.prisma.propertyAmenity.create({
        data: { propertyId, amenityId },
        include: { amenity: true },
      });
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        throw new ConflictException(
          'Amenity is already assigned to this property',
        );
      }
      throw error;
    }
  }

  async removePropertyAmenity(
    propertyId: string,
    amenityId: string,
    user: AuthenticatedUser,
  ) {
    await this.assertPropertyAccess(propertyId, user);
    await this.prisma.propertyAmenity.deleteMany({
      where: { propertyId, amenityId },
    });
    return { success: true };
  }

  async findRoomAmenities(roomId: string, user: AuthenticatedUser) {
    await this.assertRoomAccess(roomId, user);
    return this.prisma.roomAmenity.findMany({
      where: { roomId },
      include: { amenity: true },
      orderBy: { amenity: { name: 'asc' } },
    });
  }

  async addRoomAmenity(
    roomId: string,
    amenityId: string,
    user: AuthenticatedUser,
  ) {
    await this.assertRoomAccess(roomId, user);
    await this.assertAmenityExists(amenityId);
    try {
      return await this.prisma.roomAmenity.create({
        data: { roomId, amenityId },
        include: { amenity: true },
      });
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        throw new ConflictException('Amenity is already assigned to this room');
      }
      throw error;
    }
  }

  async removeRoomAmenity(
    roomId: string,
    amenityId: string,
    user: AuthenticatedUser,
  ) {
    await this.assertRoomAccess(roomId, user);
    await this.prisma.roomAmenity.deleteMany({ where: { roomId, amenityId } });
    return { success: true };
  }

  async create(
    propertyId: string,
    dto: CreateRoomDto,
    user: AuthenticatedUser,
  ) {
    await this.assertPropertyAccess(propertyId, user);
    try {
      return await this.prisma.room.create({
        data: { propertyId, ...dto, status: dto.status ?? 'available' },
      });
    } catch (error) {
      if (this.isUniqueViolation(error))
        throw new ConflictException(
          'Room number already exists for this property',
        );
      throw error;
    }
  }

  async update(id: string, dto: UpdateRoomDto, user: AuthenticatedUser) {
    const room = await this.prisma.room.findUnique({
      where: { id },
      select: { id: true, propertyId: true },
    });
    if (!room) throw new NotFoundException('Room not found');
    await this.assertPropertyAccess(room.propertyId, user);
    return this.prisma.room.update({ where: { id }, data: dto });
  }

  async remove(id: string, user: AuthenticatedUser) {
    const room = await this.prisma.room.findUnique({
      where: { id },
      select: { id: true, propertyId: true },
    });
    if (!room) throw new NotFoundException('Room not found');
    await this.assertPropertyAccess(room.propertyId, user);
    await this.prisma.room.delete({ where: { id } });
    return { success: true };
  }

  private async assertPropertyAccess(
    propertyId: string,
    user: AuthenticatedUser,
  ) {
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
      select: { ownerId: true },
    });
    if (!property) throw new NotFoundException('Property not found');
    if (!ADMIN_ROLES.includes(user.role) && property.ownerId !== user.sub) {
      throw new ForbiddenException('You do not have access to this property');
    }
  }

  private async assertRoomAccess(roomId: string, user: AuthenticatedUser) {
    const room = await this.prisma.room.findUnique({
      where: { id: roomId },
      select: { propertyId: true },
    });
    if (!room) throw new NotFoundException('Room not found');
    await this.assertPropertyAccess(room.propertyId, user);
  }

  private async assertAmenityExists(amenityId: string) {
    const amenity = await this.prisma.amenity.findUnique({
      where: { id: amenityId },
      select: { id: true },
    });
    if (!amenity) throw new NotFoundException('Amenity not found');
  }

  private isUniqueViolation(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'P2002'
    );
  }

  private isForeignKeyViolation(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'P2003'
    );
  }
}
