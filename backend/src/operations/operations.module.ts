import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { ReservationsModule } from '../reservations/reservations.module.js';
import { OperationsController } from './operations.controller.js';
import { OperationsService } from './operations.service.js';
@Module({ imports: [PassportModule.register({ defaultStrategy: 'jwt' }), ReservationsModule], controllers: [OperationsController], providers: [OperationsService] })
export class OperationsModule {}
