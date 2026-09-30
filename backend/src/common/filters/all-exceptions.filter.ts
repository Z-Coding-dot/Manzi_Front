import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';

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
        message = (b.message as string) ?? exception.message;
        details = b.message !== message ? b.message : undefined;
      }
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
