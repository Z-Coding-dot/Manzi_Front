import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { Prisma } from '@prisma/client';

interface ErrorResponseBody {
  error: {
    code: number;
    message: string;
    details?: unknown;
  };
  path: string;
  timestamp: string;
}

/**
 * Every error response from this API has the same shape, per the spec's
 * api_structure requirement for a consistent error format. Frontend clients
 * can rely on `error.message` and `error.details` always existing rather
 * than handling a different shape per endpoint.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let details: unknown;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const body = exception.getResponse();
      if (typeof body === 'string') {
        message = body;
      } else if (typeof body === 'object' && body !== null) {
        const b = body as Record<string, unknown>;
        message = typeof b.message === 'string' ? b.message : exception.message;
        details = Array.isArray(b.message) ? b.message : undefined;
      }
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError && ['P2002', 'P2003', 'P2025'].includes(exception.code)) {
      status = exception.code === 'P2025' ? HttpStatus.NOT_FOUND : HttpStatus.CONFLICT;
      message = exception.code === 'P2002' ? 'A matching record already exists' : exception.code === 'P2003' ? 'This record is referenced by other records' : 'Record not found';
    } else if (exception instanceof Error) {
      // Never leak internal error messages/stack traces to the client.
      this.logger.error(exception.message, exception.stack);
    }

    const body: ErrorResponseBody = {
      error: { code: status, message, details },
      path: request.url,
      timestamp: new Date().toISOString(),
    };

    response.status(status).json(body);
  }
}
