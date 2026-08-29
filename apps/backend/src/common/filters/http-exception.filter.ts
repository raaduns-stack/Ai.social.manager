import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ErrorCode } from '../enums/error-codes.enum';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    if (response.headersSent) {
      return;
    }
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    let errorCode = ErrorCode.BAD_REQUEST;
    let message = 'An unexpected error occurred';

    if (exception instanceof HttpException) {
      const responseContent = exception.getResponse();
      if (typeof responseContent === 'string') {
        message = responseContent;
      } else if (typeof responseContent === 'object' && responseContent !== null) {
        const resObj = responseContent as any;
        
        // Handle array validation messages from NestJS ValidationPipe
        if (Array.isArray(resObj.message)) {
          message = `Validation failed: ${resObj.message.join(', ')}`;
          errorCode = ErrorCode.VALIDATION_ERROR;
        } else {
          message = resObj.message || 'An unexpected error occurred';
          errorCode = resObj.errorCode || 'UNKNOWN_ERROR';
        }

        // Infer default error codes for NestJS built-in exceptions if not set
        if (!resObj.errorCode && errorCode !== ErrorCode.VALIDATION_ERROR) {
          if (status === 400) errorCode = ErrorCode.BAD_REQUEST;
          else if (status === 401) errorCode = ErrorCode.UNAUTHORIZED;
          else if (status === 403) errorCode = ErrorCode.FORBIDDEN;
          else if (status === 404) errorCode = ErrorCode.NOT_FOUND;
          else if (status === 409) errorCode = ErrorCode.CONFLICT;
        }
      }
    } else {
      errorCode = ErrorCode.BAD_REQUEST; // For internal errors, default to general bad request or handle below
      if (status === 500) {
        message = 'Internal server error';
        this.logger.error(`${request.method} ${request.url}`, (exception as Error)?.stack);
      }
    }

    const responsePayload = {
      statusCode: status,
      errorCode,
      message,
    };

    response.status(status).json(responsePayload);
  }
}

