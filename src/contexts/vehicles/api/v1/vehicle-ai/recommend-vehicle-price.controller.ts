import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from "@nestjs/common";
import { SkipThrottle, Throttle, ThrottlerGuard } from "@nestjs/throttler";
import { envs } from "@/src/common/envs";
import { GetOptionalUserId } from "@/src/contexts/auth/decorators/GetOptionalUserId.decorator";
import { OptionalJwtGuard } from "@/src/contexts/auth/guards/optional-jwt.guard";
import { RecommendVehiclePriceService } from "@/src/contexts/vehicles/services/recommend-vehicle-price.service";
import {
  V1_VEHICLES,
  V1_VEHICLES_AI,
  V1_VEHICLES_AI_RECOMMEND_PRICE,
} from "../../route.constants";
import { VehicleAiContextHttpDto } from "./vehicle-ai-context.http-dto";

/** Clave de caché compartida por invitados: el resultado solo depende de los datos del vehículo. */
const GUEST_PRICE_CACHE_SUBJECT = "guest";

/**
 * Precio recomendado. Admite invitados del formulario de publicación:
 * `vehicle-ai` aplica a todos; `guest-publish-ai` (más estricto en ventana larga)
 * solo a invitados (`skipIf` en AppModule).
 */
@Controller(`${V1_VEHICLES}/${V1_VEHICLES_AI}`)
@UseGuards(OptionalJwtGuard, ThrottlerGuard)
@SkipThrottle({
  "ai-search-filters": true,
  "support-tickets": true,
  "vehicle-identification": true,
  "guest-temp-upload": true,
  "guest-publish-lookup": true,
})
@Throttle({
  "vehicle-ai": {
    limit: envs.VEHICLE_AI_THROTTLE_LIMIT,
    ttl: envs.VEHICLE_AI_THROTTLE_TTL_MS,
  },
  "guest-publish-ai": {
    limit: envs.GUEST_PUBLISH_AI_THROTTLE_LIMIT,
    ttl: envs.GUEST_PUBLISH_AI_THROTTLE_TTL_MS,
  },
})
export class RecommendVehiclePriceController {
  constructor(
    private readonly recommend_vehicle_price_service: RecommendVehiclePriceService,
  ) {}

  @Post(V1_VEHICLES_AI_RECOMMEND_PRICE)
  @HttpCode(HttpStatus.OK)
  run(
    @Body() body: VehicleAiContextHttpDto,
    @GetOptionalUserId() userId: string | undefined,
  ) {
    return this.recommend_vehicle_price_service.execute(
      body,
      userId ?? GUEST_PRICE_CACHE_SUBJECT,
    );
  }
}
