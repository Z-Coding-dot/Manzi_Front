import { Logger, ValidationPipe } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import { json, urlencoded } from 'express';

import { AppModule } from './app.module.js';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter.js';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { bodyParser: false });
  const config = app.get(ConfigService);
  const logger = new Logger('HTTP');
  const proxyHops = Number(config.get<string>('TRUST_PROXY_HOPS') ?? '0');
  if (!Number.isInteger(proxyHops) || proxyHops < 0 || proxyHops > 3) throw new Error('TRUST_PROXY_HOPS must be an integer from 0 to 3');
  app.set('trust proxy', proxyHops);
  if (config.get('NODE_ENV') === 'production') {
    for (const key of ['JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET']) {
      const value = config.getOrThrow<string>(key);
      if (value.length < 32 || value.includes('replace-with')) throw new Error(`${key} must be a strong production secret`);
    }
    if (config.get('JWT_ACCESS_SECRET') === config.get('JWT_REFRESH_SECRET')) throw new Error('JWT secrets must be different');
  }

  app.use(helmet());
  app.use(json({ limit: '8mb' }));
  app.use(urlencoded({ extended: true, limit: '8mb' }));

  const corsOrigins = (config.get<string>('CORS_ORIGINS') ?? '').split(',').map(origin => origin.trim()).filter(Boolean);
  if (config.get('NODE_ENV') === 'production' && (!corsOrigins.length || corsOrigins.includes('*'))) throw new Error('Explicit CORS_ORIGINS are required in production');
  app.enableCors({
    origin: corsOrigins.length ? corsOrigins : false,
    credentials: true,
  });
  app.use((req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    res.on('finish', () => logger.log(JSON.stringify({ method: req.method, path: req.path, status: res.statusCode, durationMs: Date.now() - start })));
    next();
  });
  app.enableShutdownHooks();

  app.setGlobalPrefix('api/v1');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // strip unknown properties — never trust extra client-supplied fields
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new AllExceptionsFilter());

  const port = config.get<number>('PORT') ?? 3000;
  await app.listen(port);
  // eslint-disable-next-line no-console
  logger.log(`Manzil API listening on port ${port}`);
}

bootstrap().catch(error => { new Logger('Bootstrap').error(error); process.exitCode = 1; });
