import { Controller, Get, UseGuards } from "@nestjs/common";

import { GetUserId } from "@/src/contexts/auth/decorators/GetUserId.decorator";
import { JwtGuard } from "@/src/contexts/auth/guards/auth.guard";

import { V1_DISMISSED_VEHICLES } from "../../../../api/route.constants";
import { DismissedVehiclesService } from "../../../services/dismissed-vehicles.service";

@Controller(V1_DISMISSED_VEHICLES)
@UseGuards(JwtGuard)
export class FindAllDismissedVehiclesController {
  constructor(
    private readonly dismissedVehiclesService: DismissedVehiclesService,
  ) {}

  @Get()
  run(@GetUserId() profileId: string) {
    return this.dismissedVehiclesService.findAllForProfessional(profileId);
  }
}
