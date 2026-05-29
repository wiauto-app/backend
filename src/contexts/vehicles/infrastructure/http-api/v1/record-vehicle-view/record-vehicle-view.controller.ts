import { normalizeUserAgent } from "@/src/contexts/auth/utils/normalize-user-agent";
import { hashToken } from "@/src/contexts/shared/token_management/hash_token";
import { RecordVehicleViewUseCase } from "@/src/contexts/vehicles/application/view-use-cases/record-vehicle-view-use-case/record-vehicle-view.use-case";
import { Body, Controller, Param, Post, Req } from "@nestjs/common";
import { Request } from "express";

import { V1_VEHICLES } from "../../route.constants";
import {
  RecordVehicleViewBodyHttpDto,
  RecordVehicleViewParamsHttpDto,
} from "./record-vehicle-view.http-dto";

@Controller(V1_VEHICLES)
export class RecordVehicleViewController {
  constructor(
    private readonly record_vehicle_view_use_case: RecordVehicleViewUseCase,
  ) {}

  @Post(":vehicle_id/views")
  record(
    @Param() params: RecordVehicleViewParamsHttpDto,
    @Body() body: RecordVehicleViewBodyHttpDto,
    @Req() req: Request,
  ) {
    const referer_header = req.headers.referer ?? req.headers.referrer;
    const referer =
      typeof referer_header === "string" && referer_header.trim()
        ? referer_header.trim()
        : null;

    return this.record_vehicle_view_use_case.execute({
      vehicle_id: params.vehicle_id,
      user_id: body.user_id ?? null,
      ip_hash: hashToken(req.ip ?? ""),
      user_agent: normalizeUserAgent(req.headers["user-agent"]),
      referer,
      metadata: body.metadata ?? {},
    });
  }
}
