import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';

import { PropertiesController } from './properties.controller.js';
import { PublicPropertiesController } from './public-properties.controller.js';
import { PropertiesService } from './properties.service.js';

@Module({
  imports: [PassportModule.register({ defaultStrategy: 'jwt' })],
  controllers: [PropertiesController, PublicPropertiesController],
  providers: [PropertiesService],
  exports: [PropertiesService],
})
export class PropertiesModule {}
