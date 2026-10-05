import {
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from "@nestjs/common";

import { GetUserId } from "@/src/contexts/auth/decorators/GetUserId.decorator";
import { JwtGuard } from "@/src/contexts/auth/guards/auth.guard";

import { AppraisalEstimateService } from "../../../services/appraisal-estimate.service";
import { V1_APPRAISALS } from "../../route.constants";

/** Acciones del vendedor sobre las ofertas de su tasación. */
@Controller(V1_APPRAISALS)
@UseGuards(JwtGuard)
export class AppraisalOffersActionsController {
  constructor(private readonly appraisal_estimate_service: AppraisalEstimateService) {}

  @Post(":id/request-offers")
  @HttpCode(HttpStatus.OK)
  requestOffers(
    @GetUserId() profile_id: string,
    @Param("id", ParseUUIDPipe) id: string,
  ) {
    return this.appraisal_estimate_service.requestOffers(profile_id, id);
  }

  @Post(":id/offers/:offer_id/accept")
  @HttpCode(HttpStatus.OK)
  accept(
    @GetUserId() profile_id: string,
    @Param("id", ParseUUIDPipe) id: string,
    @Param("offer_id", ParseUUIDPipe) offer_id: string,
  ) {
    return this.appraisal_estimate_service.acceptOffer(profile_id, id, offer_id);
  }

  @Post(":id/offers/:offer_id/reject")
  @HttpCode(HttpStatus.OK)
  reject(
    @GetUserId() profile_id: string,
    @Param("id", ParseUUIDPipe) id: string,
    @Param("offer_id", ParseUUIDPipe) offer_id: string,
  ) {
    return this.appraisal_estimate_service.rejectOffer(profile_id, id, offer_id);
  }
}
