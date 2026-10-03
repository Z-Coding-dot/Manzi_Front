import { ViewsController } from './views.controller.js';
import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { AdminController } from './admin.controller.js';
import { AdminService } from './admin.service.js';
@Module({ imports: [PassportModule.register({ defaultStrategy: 'jwt' })], controllers: [AdminController, ViewsController], providers: [AdminService] })
export class AdminModule {}
