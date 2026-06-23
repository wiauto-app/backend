import { Controller, Get, Param } from "@nestjs/common";

import { FindOneDealershipBySlugUseCase } from "../../../../application/dealership/find-one-dealership-by-slug-use-case/find-one-dealership-by-slug.use-case";
import { V1_DEALERSHIPS } from "../../../route.constants";

import { FindDealershipBySlugHttpDto } from "./find-one-dealership-by-slug.http-dto";

@Controller(V1_DEALERSHIPS)
export class FindDealershipBySlugController {
  constructor(
    private readonly find_one_dealership_by_slug_use_case: FindOneDealershipBySlugUseCase,
  ) {}

  @Get("by-slug/:slug")
  run(@Param() params: FindDealershipBySlugHttpDto) {
    return this.find_one_dealership_by_slug_use_case.execute({ slug: params.slug });
  }
}
