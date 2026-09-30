import { Controller, Get, Inject, Param } from '@nestjs/common';

import { PropertiesService } from './properties.service.js';

@Controller('marketplace/properties')
export class PublicPropertiesController {
  constructor(
    @Inject(PropertiesService) private propertiesService: PropertiesService,
  ) {}

  @Get()
  findPublished() {
    return this.propertiesService.findPublished();
  }

  @Get(':slug')
  findPublishedBySlug(@Param('slug') slug: string) {
    return this.propertiesService.findPublishedBySlug(slug);
  }
}
