import { Controller, Get, Param } from "@nestjs/common";

import { DealershipService } from "../../../services/dealership.service";
import { V1_DEALERSHIPS } from "../../route.constants";

import { FindDealershipBySlugHttpDto } from "./find-one-dealership-by-slug.http-dto";

@Controller(V1_DEALERSHIPS)
export class FindDealershipBySlugController {
  constructor(
    private readonly dealership_service: DealershipService,
  ) {}

  @Get("by-slug/:slug")
  run(@Param() params: FindDealershipBySlugHttpDto) {
    return this.dealership_service.findOneBySlug({ slug: params.slug });
  }
}
