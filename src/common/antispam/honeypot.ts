import {
  applyDecorators,
  type CallHandler,
  type ExecutionContext,
  Logger,
  type NestInterceptor,
  SetMetadata,
  UseInterceptors,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { IsOptional, IsString, MaxLength } from "class-validator";
import type { Request } from "express";
import { type Observable, of } from "rxjs";

import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";

import { resolveClientIp } from "../client-ip";

/**
 * Campo trampa de los formularios públicos. El frontend lo envía SOLO si no está
 * vacío (input oculto que solo rellenan los bots).
 */
export const HONEYPOT_FIELD = "hp_website";
export const HONEYPOT_MAX_LENGTH = 200;

const HONEYPOT_FAKE_RESPONSE_METADATA = "antispam:honeypot-fake-response";

export type HoneypotRequestBody = Record<string, unknown>;

/** Construye una respuesta con la misma forma que la del endpoint real. */
export type HoneypotFakeResponseFactory = (
  body: HoneypotRequestBody,
  params: HoneypotRouteParams,
) => unknown;

/** Parámetros de ruta crudos (p. ej. `vehicle_id`). */
export type HoneypotRouteParams = Partial<Record<string, string>>;

/**
 * Base para DTOs de formularios públicos protegidos con `@Honeypot`. El campo
 * nunca se debe mapear a entidades: los servicios copian campos explícitos.
 */
export class HoneypotHttpDto {
  @IsOptional()
  @IsString()
  @MaxLength(HONEYPOT_MAX_LENGTH)
  hp_website?: string;
}

const isHoneypotFilled = (body: unknown): boolean => {
  if (typeof body !== "object" || body === null) {
    return false;
  }

  const value: unknown = (body as HoneypotRequestBody)[HONEYPOT_FIELD];
  if (typeof value === "string") {
    return value.trim().length > 0;
  }

  return value !== undefined && value !== null;
};

/** Lee un string del body crudo (sin validar) para componer la respuesta falsa. */
export const honeypotBodyString = (
  body: HoneypotRequestBody,
  key: string,
): string | null => {
  const value = body[key];
  return typeof value === "string" ? value : null;
};

/**
 * Si el honeypot viene relleno, corta la petición ANTES de pipes y handler:
 * no se persiste nada ni se envían notificaciones, y se responde con un éxito
 * falso (mismo status y forma) para que el bot no aprenda a esquivarlo.
 */
@Injectable()
export class HoneypotInterceptor implements NestInterceptor {
  private readonly logger = new Logger(HoneypotInterceptor.name);

  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const body: unknown = request.body;

    if (!isHoneypotFilled(body)) {
      return next.handle();
    }

    this.logger.warn(
      `Honeypot activado en ${request.method} ${request.originalUrl} (ip=${resolveClientIp(request)}); petición descartada`,
    );

    const fake_response_factory =
      this.reflector.getAllAndOverride<HoneypotFakeResponseFactory | undefined>(
        HONEYPOT_FAKE_RESPONSE_METADATA,
        [context.getHandler(), context.getClass()],
      );

    return of(
      fake_response_factory?.(
        body as HoneypotRequestBody,
        request.params as HoneypotRouteParams,
      ) ?? {},
    );
  }
}

/** Activa el honeypot en un handler/controlador con su respuesta falsa. */
export const Honeypot = (
  fake_response: HoneypotFakeResponseFactory,
): ClassDecorator & MethodDecorator =>
  applyDecorators(
    SetMetadata(HONEYPOT_FAKE_RESPONSE_METADATA, fake_response),
    UseInterceptors(HoneypotInterceptor),
  );
