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
import { VehiclePriceWatchService } from "../../../services/vehicle-price-watch.service";

@Controller(V1_VEHICLES)
@UseGuards(JwtGuard)
export class PriceWatchController {
  constructor(
    private readonly vehiclePriceWatchService: VehiclePriceWatchService,
  ) {}

  @Get(":vehicle_id/price-watch")
  findOne(
    @GetUserId() profileId: string,
    @Param("vehicle_id", new ParseUUIDPipe()) vehicleId: string,
  ) {
    return this.vehiclePriceWatchService.findOne({
      profile_id: profileId,
      vehicle_id: vehicleId,
    });
  }

  @Post(":vehicle_id/price-watch")
  create(
    @GetUserId() profileId: string,
    @Param("vehicle_id", new ParseUUIDPipe()) vehicleId: string,
  ) {
    return this.vehiclePriceWatchService.create({
      profile_id: profileId,
      vehicle_id: vehicleId,
    });
  }

  @Delete(":vehicle_id/price-watch")
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @GetUserId() profileId: string,
    @Param("vehicle_id", new ParseUUIDPipe()) vehicleId: string,
  ): Promise<void> {
    await this.vehiclePriceWatchService.remove({
      profile_id: profileId,
      vehicle_id: vehicleId,
    });
  }
}
