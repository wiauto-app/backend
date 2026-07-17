import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from "@nestjs/common";
import { Throttle, ThrottlerGuard } from "@nestjs/throttler";
import { envs } from "@/src/common/envs";
import { GetUserId } from "@/src/contexts/auth/decorators/GetUserId.decorator";
import { JwtGuard } from "@/src/contexts/auth/guards/auth.guard";
import { RecommendVehiclePriceService } from "@/src/contexts/vehicles/services/recommend-vehicle-price.service";
import {
  V1_VEHICLES,
  V1_VEHICLES_AI,
  V1_VEHICLES_AI_RECOMMEND_PRICE,
} from "../../route.constants";
import { VehicleAiContextHttpDto } from "./vehicle-ai-context.http-dto";

@Controller(`${V1_VEHICLES}/${V1_VEHICLES_AI}`)
@UseGuards(JwtGuard, ThrottlerGuard)
@Throttle({
  "vehicle-ai": {
    limit: envs.VEHICLE_AI_THROTTLE_LIMIT,
    ttl: envs.VEHICLE_AI_THROTTLE_TTL_MS,
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
    @GetUserId() userId: string,
  ) {
    return this.recommend_vehicle_price_service.execute(body, userId);
  }
}
