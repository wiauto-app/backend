import { Controller, Get, Query, Req, UseGuards } from "@nestjs/common";

import { GetOptionalUserId } from "@/src/contexts/auth/decorators/GetOptionalUserId.decorator";
import { OptionalJwtGuard } from "@/src/contexts/auth/guards/optional-jwt.guard";
import { VehicleService } from "@/src/contexts/vehicles/services/vehicle.service";
import { VehicleSearchHistoryService } from "@/src/contexts/vehicles/search-history/services/vehicle-search-history.service";
import {
  isSearchRecordingRequested,
  RECORD_SEARCH_HEADER,
} from "@/src/contexts/vehicles/search-history/utils/normalize-vehicle-search-query";

import { V1_VEHICLES } from "../../route.constants";
import { FindAllVehiclesHttpDto } from "./find-all-vehicles.http-dto";
import { Request } from "express";

@Controller(V1_VEHICLES)
export class FindAllVehiclesController {
  constructor(
    private readonly vehicle_service: VehicleService,
    private readonly vehicle_search_history_service: VehicleSearchHistoryService,
  ) { }

  @Get()
  @UseGuards(OptionalJwtGuard)
  async run(
    @Query() findAllVehiclesHttpDto: FindAllVehiclesHttpDto,
    @GetOptionalUserId() profile_id?: string,
    @Req() req?: Request,
  ) {
    const result = await this.vehicle_service.findAll(findAllVehiclesHttpDto, profile_id, req?.url);

    // Opt-in: solo la pantalla de búsqueda envía `x-record-search: 1`, para no
    // registrar carruseles ni secciones relacionadas que reutilizan este listado.
    if (
      profile_id &&
      isSearchRecordingRequested(req?.headers[RECORD_SEARCH_HEADER])
    ) {
      // Fire-and-forget: no añade latencia ni puede romper el listado.
      this.vehicle_search_history_service.recordInBackground({
        user_id: profile_id,
        params: findAllVehiclesHttpDto,
        results_count: typeof result.total === "number" ? result.total : null,
      });
    }

    return result;
  }
}
