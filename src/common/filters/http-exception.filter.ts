/**
 * Global exception filter.
 * Menyamakan format error response dan mengirim log warning/error ke Winston.
 */
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

interface ExceptionResponseObject {
  message?: string | string[];
  error?: string;
}

// @Catch() tanpa argumen artinya menangkap semua exception yang tidak tertangani.
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  // Logger di-inject dari provider nest-winston.
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  // Method catch adalah entry point filter saat exception terjadi.
  catch(exception: unknown, host: ArgumentsHost): void {
    // Ambil objek request/response dari konteks HTTP.
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    let message: string | string[] = 'Internal server error';

    if (exception instanceof HttpException) {
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null
      ) {
        const responseObj = exceptionResponse as ExceptionResponseObject;
        message = responseObj.message ?? 'Internal server error';
      }
    }

    const errorResponse = {
      statusCode: status,
      message,
      error:
        exception instanceof HttpException
          ? exception.name
          : 'InternalServerError',
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    // Log the error
    if (status >= 500) {
      this.logger.error(`${request.method} ${request.url}`, {
        statusCode: status,
        error: exception instanceof Error ? exception.stack : String(exception),
      });
    } else {
      this.logger.warn(`${request.method} ${request.url}`, {
        statusCode: status,
        message,
      });
    }

    // Kirim response error dalam format yang konsisten.
    response.status(status).json(errorResponse);
  }
}
