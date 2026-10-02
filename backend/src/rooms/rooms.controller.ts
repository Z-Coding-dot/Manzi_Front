import { ValidatedBody } from '../common/decorators/validated-input.decorator.js';
import {
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import type { AuthenticatedUser } from '../common/types/authenticated-user.js';
import { AssignAmenityDto } from './dto/assign-amenity.dto.js';
import { CreateBedDto } from './dto/create-bed.dto.js';
import { CreateRoomDto } from './dto/create-room.dto.js';
import { UpdateBedDto } from './dto/update-bed.dto.js';
import { UpdateRoomDto } from './dto/update-room.dto.js';
import { RoomsService } from './rooms.service.js';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('property_owner', 'property_manager', 'receptionist', 'property_staff', 'admin', 'super_admin')
export class RoomsController {
  constructor(@Inject(RoomsService) private roomsService: RoomsService) {}

  @Get('amenities')
  findAmenities() {
    return this.roomsService.findAmenities();
  }

  @Get('properties/:propertyId/amenities')
  findPropertyAmenities(
    @Param('propertyId', ParseUUIDPipe) propertyId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.roomsService.findPropertyAmenities(propertyId, user);
  }

  @Post('properties/:propertyId/amenities')
  @UseGuards(RolesGuard)
  @Roles('property_owner', 'admin', 'super_admin')
  addPropertyAmenity(
    @Param('propertyId', ParseUUIDPipe) propertyId: string,
    @ValidatedBody(AssignAmenityDto) dto: AssignAmenityDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.roomsService.addPropertyAmenity(
      propertyId,
      dto.amenityId,
      user,
    );
  }

  @Delete('properties/:propertyId/amenities/:amenityId')
  @UseGuards(RolesGuard)
  @Roles('property_owner', 'admin', 'super_admin')
  removePropertyAmenity(
    @Param('propertyId', ParseUUIDPipe) propertyId: string,
    @Param('amenityId', ParseUUIDPipe) amenityId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.roomsService.removePropertyAmenity(propertyId, amenityId, user);
  }

  @Get('rooms/:roomId/beds')
  findBeds(
    @Param('roomId', ParseUUIDPipe) roomId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.roomsService.findBeds(roomId, user);
  }

  @Post('rooms/:roomId/beds')
  @UseGuards(RolesGuard)
  @Roles('property_owner', 'admin', 'super_admin')
  createBed(
    @Param('roomId', ParseUUIDPipe) roomId: string,
    @ValidatedBody(CreateBedDto) dto: CreateBedDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.roomsService.createBed(roomId, dto, user);
  }

  @Patch('beds/:id')
  @UseGuards(RolesGuard)
  @Roles('property_owner', 'admin', 'super_admin')
  updateBed(
    @Param('id', ParseUUIDPipe) id: string,
    @ValidatedBody(UpdateBedDto) dto: UpdateBedDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.roomsService.updateBed(id, dto, user);
  }

  @Delete('beds/:id')
  @UseGuards(RolesGuard)
  @Roles('property_owner', 'admin', 'super_admin')
  removeBed(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.roomsService.removeBed(id, user);
  }

  @Get('rooms/:roomId/amenities')
  findRoomAmenities(
    @Param('roomId', ParseUUIDPipe) roomId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.roomsService.findRoomAmenities(roomId, user);
  }

  @Post('rooms/:roomId/amenities')
  @UseGuards(RolesGuard)
  @Roles('property_owner', 'admin', 'super_admin')
  addRoomAmenity(
    @Param('roomId', ParseUUIDPipe) roomId: string,
    @ValidatedBody(AssignAmenityDto) dto: AssignAmenityDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.roomsService.addRoomAmenity(roomId, dto.amenityId, user);
  }

  @Delete('rooms/:roomId/amenities/:amenityId')
  @UseGuards(RolesGuard)
  @Roles('property_owner', 'admin', 'super_admin')
  removeRoomAmenity(
    @Param('roomId', ParseUUIDPipe) roomId: string,
    @Param('amenityId', ParseUUIDPipe) amenityId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.roomsService.removeRoomAmenity(roomId, amenityId, user);
  }

  @Get('properties/:propertyId/rooms')
  findAll(
    @Param('propertyId', ParseUUIDPipe) propertyId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.roomsService.findAll(propertyId, user);
  }

  @Post('properties/:propertyId/rooms')
  @UseGuards(RolesGuard)
  @Roles('property_owner', 'property_manager', 'admin', 'super_admin')
  create(
    @Param('propertyId', ParseUUIDPipe) propertyId: string,
    @ValidatedBody(CreateRoomDto) dto: CreateRoomDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.roomsService.create(propertyId, dto, user);
  }

  @Patch('rooms/:id')
  @UseGuards(RolesGuard)
  @Roles('property_owner', 'property_manager', 'admin', 'super_admin')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @ValidatedBody(UpdateRoomDto) dto: UpdateRoomDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.roomsService.update(id, dto, user);
  }

  @Delete('rooms/:id')
  @UseGuards(RolesGuard)
  @Roles('property_owner', 'property_manager', 'admin', 'super_admin')
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.roomsService.remove(id, user);
  }
}
