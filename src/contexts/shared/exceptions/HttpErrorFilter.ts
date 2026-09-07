import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';
import { Response } from 'express';

@Catch(HttpException)
export class HttpErrorFilter
  implements ExceptionFilter
{
  catch(
    exception: HttpException,
    host: ArgumentsHost,
  ) {
    const ctx = host.switchToHttp();

    const response =
      ctx.getResponse<Response>();

    const status =
      exception.getStatus();

    const exceptionResponse =
      exception.getResponse();

    let message = 'Error';

    if (
      typeof exceptionResponse === 'string'
    ) {
      message = exceptionResponse;
    }

    if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
      const raw_message = (exceptionResponse as Record<string, unknown>)
        .message;
      if (Array.isArray(raw_message)) {
        message = raw_message.map(String).join(', ');
      } else if (typeof raw_message === 'string' && raw_message.trim()) {
        message = raw_message;
      }
    }

    response.status(status).json({
      ok: false,
      status,
      message,
      data: null,
    });
  }
}