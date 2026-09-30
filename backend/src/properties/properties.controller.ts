import {
  Body,
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
import { CreateDocumentDto } from './dto/create-document.dto.js';
import { CreatePropertyDto } from './dto/create-property.dto.js';
import { CreateStaffDto } from './dto/create-staff.dto.js';
import { ReviewPropertyDto } from './dto/review-property.dto.js';
import { UpdatePropertyDto } from './dto/update-property.dto.js';
import { UpdateStaffDto } from './dto/update-staff.dto.js';
import { PropertiesService } from './properties.service.js';

@Controller('properties')
@UseGuards(JwtAuthGuard)
export class PropertiesController {
  constructor(
    @Inject(PropertiesService) private propertiesService: PropertiesService,
  ) {}

  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.propertiesService.findAll(user);
  }

  @Get(':id')
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.propertiesService.findOne(id, user);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('property_owner', 'admin', 'super_admin')
  create(
    @Body() dto: CreatePropertyDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.propertiesService.create(dto, user);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('property_owner', 'admin', 'super_admin')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePropertyDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.propertiesService.update(id, dto, user);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('property_owner', 'admin', 'super_admin')
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.propertiesService.remove(id, user);
  }

  @Post(':id/submit')
  @UseGuards(RolesGuard)
  @Roles('property_owner', 'admin', 'super_admin')
  submitVerification(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.propertiesService.submitVerification(id, user);
  }

  @Patch(':id/review')
  @UseGuards(RolesGuard)
  @Roles('admin', 'super_admin')
  review(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReviewPropertyDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.propertiesService.review(id, dto.status, user);
  }

  @Get(':id/documents')
  listDocuments(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.propertiesService.listDocuments(id, user);
  }

  @Post(':id/documents')
  @UseGuards(RolesGuard)
  @Roles('property_owner', 'admin', 'super_admin')
  addDocument(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateDocumentDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.propertiesService.addDocument(id, dto, user);
  }

  @Delete(':id/documents/:documentId')
  @UseGuards(RolesGuard)
  @Roles('property_owner', 'admin', 'super_admin')
  removeDocument(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('documentId', ParseUUIDPipe) documentId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.propertiesService.removeDocument(id, documentId, user);
  }

  @Get(':id/staff')
  listStaff(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.propertiesService.listStaff(id, user);
  }

  @Post(':id/staff')
  @UseGuards(RolesGuard)
  @Roles('property_owner', 'admin', 'super_admin')
  addStaff(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateStaffDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.propertiesService.addStaff(id, dto, user);
  }

  @Patch(':id/staff/:staffId')
  @UseGuards(RolesGuard)
  @Roles('property_owner', 'admin', 'super_admin')
  updateStaff(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('staffId', ParseUUIDPipe) staffId: string,
    @Body() dto: UpdateStaffDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.propertiesService.updateStaff(id, staffId, dto, user);
  }

  @Delete(':id/staff/:staffId')
  @UseGuards(RolesGuard)
  @Roles('property_owner', 'admin', 'super_admin')
  removeStaff(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('staffId', ParseUUIDPipe) staffId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.propertiesService.removeStaff(id, staffId, user);
  }
}
