import { Body, Controller, HttpCode, HttpStatus, Post, Req, UseGuards } from "@nestjs/common";
import { SkipThrottle, Throttle, ThrottlerGuard } from "@nestjs/throttler";
import type { Request } from "express";
import { envs } from "@/src/common/envs";
import { resolveClientIp } from "@/src/common/client-ip";
import { OptionalJwtGuard } from "@/src/contexts/auth/guards/optional-jwt.guard";
import { GenerateVehicleDescriptionService } from "@/src/contexts/vehicles/services/generate-vehicle-description.service";
import {
  V1_VEHICLES,
  V1_VEHICLES_AI,
  V1_VEHICLES_AI_GENERATE_DESCRIPTION,
} from "../../route.constants";
import { VehicleAiContextHttpDto } from "./vehicle-ai-context.http-dto";
import { GetOptionalUserId } from "@/src/contexts/auth/decorators/GetOptionalUserId.decorator";

/**
 * Descripción IA. Admite invitados del formulario de publicación: el cooldown
 * del servicio se aplica por usuario o, para invitados, por IP; además
 * `guest-publish-ai` limita a invitados (`skipIf` en AppModule). Para usuarios
 * autenticados el comportamiento no cambia (solo el cooldown del servicio).
 */
@Controller(`${V1_VEHICLES}/${V1_VEHICLES_AI}`)
@UseGuards(OptionalJwtGuard, ThrottlerGuard)
@SkipThrottle({
  "vehicle-ai": true,
  "ai-search-filters": true,
  "support-tickets": true,
  "vehicle-identification": true,
  "guest-temp-upload": true,
  "guest-publish-lookup": true,
})
@Throttle({
  "guest-publish-ai": {
    limit: envs.GUEST_PUBLISH_AI_THROTTLE_LIMIT,
    ttl: envs.GUEST_PUBLISH_AI_THROTTLE_TTL_MS,
  },
})
export class GenerateVehicleDescriptionController {
  constructor(
    private readonly generate_vehicle_description_service: GenerateVehicleDescriptionService,
  ) {}

  @Post(V1_VEHICLES_AI_GENERATE_DESCRIPTION)
  @HttpCode(HttpStatus.OK)
  run(
    @Body() body: VehicleAiContextHttpDto,
    @GetOptionalUserId() userId: string | undefined,
    @Req() req: Request,
  ) {
    const rate_limit_subject = userId ?? `guest:${resolveClientIp(req)}`;
    return this.generate_vehicle_description_service.execute(
      body,
      rate_limit_subject,
    );
  }
}
