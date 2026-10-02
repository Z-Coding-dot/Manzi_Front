import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, Reflector } from '@nestjs/core';
import {
  getOptionsToken,
  getStorageToken,
  ThrottlerGuard,
  ThrottlerModule,
} from '@nestjs/throttler';

import { AuthModule } from './auth/auth.module.js';
import { AdminModule } from './admin/admin.module.js';
import { HealthController } from './health/health.controller.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { PropertiesModule } from './properties/properties.module.js';
import { RoomsModule } from './rooms/rooms.module.js';
import { ReservationsModule } from './reservations/reservations.module.js';
import { NotificationsModule } from './notifications/notifications.module.js';
import { CmsModule } from './cms/cms.module.js';
import { OperationsModule } from './operations/operations.module.js';
import { UsersModule } from './users/users.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot({
      throttlers: [{ ttl: 60_000, limit: 100 }], // sane global default; endpoints can override with @Throttle
    }),
    PrismaModule,
    AuthModule,
    AdminModule,
    PropertiesModule,
    RoomsModule,
    ReservationsModule,
    NotificationsModule,
    CmsModule,
    OperationsModule,
    UsersModule,
  ],
  controllers: [HealthController],
  providers: [
    Reflector,
    {
      provide: APP_GUARD,
      useFactory: (
        options: ConstructorParameters<typeof ThrottlerGuard>[0],
        storage: ConstructorParameters<typeof ThrottlerGuard>[1],
        reflector: Reflector,
      ) => new ThrottlerGuard(options, storage, reflector),
      inject: [getOptionsToken(), getStorageToken(), Reflector],
    },
  ],
})
export class AppModule {}
