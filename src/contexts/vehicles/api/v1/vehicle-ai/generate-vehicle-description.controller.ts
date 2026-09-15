import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from "@nestjs/common";
import { JwtGuard } from "@/src/contexts/auth/guards/auth.guard";
import { GenerateVehicleDescriptionService } from "@/src/contexts/vehicles/services/generate-vehicle-description.service";
import {
  V1_VEHICLES,
  V1_VEHICLES_AI,
  V1_VEHICLES_AI_GENERATE_DESCRIPTION,
} from "../../route.constants";
import { VehicleAiContextHttpDto } from "./vehicle-ai-context.http-dto";
import { GetUserId } from "@/src/contexts/auth/decorators/GetUserId.decorator";

@Controller(`${V1_VEHICLES}/${V1_VEHICLES_AI}`)
@UseGuards(JwtGuard)
export class GenerateVehicleDescriptionController {
  constructor(
    private readonly generate_vehicle_description_service: GenerateVehicleDescriptionService,
  ) {}

  @Post(V1_VEHICLES_AI_GENERATE_DESCRIPTION)
  @HttpCode(HttpStatus.OK)
  run(@Body() body: VehicleAiContextHttpDto, @GetUserId() userId: string) {
    return this.generate_vehicle_description_service.execute(body, userId);
  }
}
