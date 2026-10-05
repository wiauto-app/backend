import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Put,
  Query,
  UseGuards,
} from "@nestjs/common";

import { GetUserId } from "@/src/contexts/auth/decorators/GetUserId.decorator";
import { JwtGuard } from "@/src/contexts/auth/guards/auth.guard";

import { FindAppraisalOpportunitiesHttpDto } from "../../../dto/find-appraisal-opportunities.http-dto";
import { UpsertAppraisalOfferHttpDto } from "../../../dto/upsert-appraisal-offer.http-dto";
import { AppraisalOpportunitiesService } from "../../../services/appraisal-opportunities.service";
import { V1_DEALERSHIP_APPRAISAL_OPPORTUNITIES } from "../../route.constants";

/** Tasaciones para concesionarios. El rol owner/admin se valida en el servicio. */
@Controller(V1_DEALERSHIP_APPRAISAL_OPPORTUNITIES)
@UseGuards(JwtGuard)
export class AppraisalOpportunitiesController {
  constructor(private readonly appraisal_opportunities_service: AppraisalOpportunitiesService) {}

  @Get()
  findAll(
    @GetUserId() profile_id: string,
    @Query() query: FindAppraisalOpportunitiesHttpDto,
  ) {
    return this.appraisal_opportunities_service.findAll(profile_id, query);
  }

  @Get(":id")
  findOne(@GetUserId() profile_id: string, @Param("id", ParseUUIDPipe) id: string) {
    return this.appraisal_opportunities_service.findOne(profile_id, id);
  }

  @Put(":id/offer")
  upsertOffer(
    @GetUserId() profile_id: string,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() body: UpsertAppraisalOfferHttpDto,
  ) {
    return this.appraisal_opportunities_service.upsertOffer(profile_id, id, body);
  }

  @Delete(":id/offer")
  withdrawOffer(
    @GetUserId() profile_id: string,
    @Param("id", ParseUUIDPipe) id: string,
  ) {
    return this.appraisal_opportunities_service.withdrawOffer(profile_id, id);
  }
}
