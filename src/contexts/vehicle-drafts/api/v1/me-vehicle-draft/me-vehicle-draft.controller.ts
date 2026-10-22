import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Put,
  UseGuards,
} from "@nestjs/common";

import { GetUserId } from "@/src/contexts/auth/decorators/GetUserId.decorator";
import { JwtGuard } from "@/src/contexts/auth/guards/auth.guard";

import { UpsertVehicleDraftHttpDto } from "../../../dto/upsert-vehicle-draft.http-dto";
import { VehicleDraftService } from "../../../services/vehicle-draft.service";
import { V1_VEHICLE_DRAFTS } from "../../route.constants";

@Controller(`${V1_VEHICLE_DRAFTS}/me`)
@UseGuards(JwtGuard)
export class MeVehicleDraftController {
  constructor(private readonly vehicleDraftService: VehicleDraftService) {}

  @Get()
  getMine(@GetUserId() profileId: string) {
    return this.vehicleDraftService.findMine(profileId);
  }

  @Put()
  upsertMine(
    @GetUserId() profileId: string,
    @Body() body: UpsertVehicleDraftHttpDto,
  ) {
    return this.vehicleDraftService.upsertMine(profileId, body);
  }

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeMine(@GetUserId() profileId: string): Promise<void> {
    await this.vehicleDraftService.removeMine(profileId);
  }
}
