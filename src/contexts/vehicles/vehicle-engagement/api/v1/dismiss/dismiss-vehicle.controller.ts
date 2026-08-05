import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from "@nestjs/common";

import { GetUserId } from "@/src/contexts/auth/decorators/GetUserId.decorator";
import { JwtGuard } from "@/src/contexts/auth/guards/auth.guard";

import { V1_VEHICLES } from "../../../../api/route.constants";
import { DismissedVehiclesService } from "../../../services/dismissed-vehicles.service";

@Controller(V1_VEHICLES)
@UseGuards(JwtGuard)
export class DismissVehicleController {
  constructor(
    private readonly dismissedVehiclesService: DismissedVehiclesService,
  ) {}

  @Get(":vehicle_id/dismiss")
  findOne(
    @GetUserId() profileId: string,
    @Param("vehicle_id", new ParseUUIDPipe()) vehicleId: string,
  ) {
    return this.dismissedVehiclesService.findOne({
      profile_id: profileId,
      vehicle_id: vehicleId,
    });
  }

  @Post(":vehicle_id/dismiss")
  create(
    @GetUserId() profileId: string,
    @Param("vehicle_id", new ParseUUIDPipe()) vehicleId: string,
  ) {
    return this.dismissedVehiclesService.create({
      profile_id: profileId,
      vehicle_id: vehicleId,
    });
  }

  @Delete(":vehicle_id/dismiss")
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @GetUserId() profileId: string,
    @Param("vehicle_id", new ParseUUIDPipe()) vehicleId: string,
  ): Promise<void> {
    await this.dismissedVehiclesService.remove({
      profile_id: profileId,
      vehicle_id: vehicleId,
    });
  }
}
