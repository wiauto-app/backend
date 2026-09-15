import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from "@nestjs/common";
import { FastifyReply } from "fastify";

@Catch(HttpException)
export class HttpErrorFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<FastifyReply>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    let message = "Error";
    let retryAfter: number | undefined;

    if (typeof exceptionResponse === "string") {
      message = exceptionResponse;
    }

    if (typeof exceptionResponse === "object" && exceptionResponse !== null) {
      const payload = exceptionResponse as Record<string, unknown>;
      const rawMessage = payload.message;
      if (Array.isArray(rawMessage)) {
        message = rawMessage.map(String).join(", ");
      } else if (typeof rawMessage === "string" && rawMessage.trim()) {
        message = rawMessage;
      }

      if (
        typeof payload.retryAfter === "number" &&
        Number.isFinite(payload.retryAfter) &&
        payload.retryAfter > 0
      ) {
        retryAfter = Math.ceil(payload.retryAfter);
      }
    }

    if (retryAfter != null) {
      response.header("Retry-After", String(retryAfter));
    }

    response.status(status).send({
      ok: false,
      status,
      message,
      data: null,
      ...(retryAfter != null ? { retryAfter } : {}),
    });
  }
}
