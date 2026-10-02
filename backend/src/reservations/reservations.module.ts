import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { GuestsController, ReservationsController } from './reservations.controller.js';
import { ReservationsService } from './reservations.service.js';
import { PropertyStatsController } from './stats.controller.js';
@Module({ imports: [PassportModule.register({ defaultStrategy: 'jwt' })], controllers: [ReservationsController, GuestsController, PropertyStatsController], providers: [ReservationsService], exports: [ReservationsService] })
export class ReservationsModule {}
