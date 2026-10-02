import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { AdminCmsController, PublicCmsController } from './cms.controller.js';
import { CmsService } from './cms.service.js';
@Module({ imports: [PassportModule.register({ defaultStrategy: 'jwt' })], controllers: [AdminCmsController, PublicCmsController], providers: [CmsService] })
export class CmsModule {}
