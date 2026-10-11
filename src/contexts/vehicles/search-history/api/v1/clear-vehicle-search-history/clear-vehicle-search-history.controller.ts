import {
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  UseGuards,
} from "@nestjs/common";

import { GetUserId } from "@/src/contexts/auth/decorators/GetUserId.decorator";
import { JwtGuard } from "@/src/contexts/auth/guards/auth.guard";

import {
  V1_VEHICLES,
  V1_VEHICLES_SEARCH_HISTORY,
} from "../../../../api/route.constants";
import { VehicleSearchHistoryService } from "../../../services/vehicle-search-history.service";

@Controller(V1_VEHICLES)
@UseGuards(JwtGuard)
export class ClearVehicleSearchHistoryController {
  constructor(
    private readonly vehicleSearchHistoryService: VehicleSearchHistoryService,
  ) {}

  @Delete(V1_VEHICLES_SEARCH_HISTORY)
  @HttpCode(HttpStatus.NO_CONTENT)
  async run(@GetUserId() userId: string): Promise<void> {
    await this.vehicleSearchHistoryService.clear(userId);
  }
}
