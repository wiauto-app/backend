import { Controller, Get, Query, UseGuards } from "@nestjs/common";

import { GetUserId } from "@/src/contexts/auth/decorators/GetUserId.decorator";
import { JwtGuard } from "@/src/contexts/auth/guards/auth.guard";
import { LeadsService } from "@/src/contexts/vehicles/services/leads.service";

import { V1_LEADS } from "../../route.constants";
import { FindSellerLeadsHttpDto } from "./find-seller-leads.http-dto";

@Controller(V1_LEADS)
@UseGuards(JwtGuard)
export class FindSellerLeadsController {
  constructor(private readonly leads_service: LeadsService) {}

  @Get()
  findAll(
    @GetUserId() profile_id: string,
    @Query() query: FindSellerLeadsHttpDto,
  ) {
    return this.leads_service.findForSeller({
      viewer_profile_id: profile_id,
      from: query.from,
      to: query.to,
      sort: query.sort ?? "desc",
      page: query.page,
      limit: query.limit,
    });
  }
}
