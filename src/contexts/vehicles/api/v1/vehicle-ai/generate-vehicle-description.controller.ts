import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from "@nestjs/common";
import { Throttle, ThrottlerGuard } from "@nestjs/throttler";
import { envs } from "@/src/common/envs";
import { JwtGuard } from "@/src/contexts/auth/guards/auth.guard";
import { GenerateVehicleDescriptionService } from "@/src/contexts/vehicles/services/generate-vehicle-description.service";
import {
  V1_VEHICLES,
  V1_VEHICLES_AI,
  V1_VEHICLES_AI_GENERATE_DESCRIPTION,
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
export class GenerateVehicleDescriptionController {
  constructor(
    private readonly generate_vehicle_description_service: GenerateVehicleDescriptionService,
  ) {}

  @Post(V1_VEHICLES_AI_GENERATE_DESCRIPTION)
  @HttpCode(HttpStatus.OK)
  run(@Body() body: VehicleAiContextHttpDto) {
    return this.generate_vehicle_description_service.execute(body);
  }
}
