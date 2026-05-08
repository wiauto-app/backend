import { Controller, Get, Query } from "@nestjs/common";

import { FindAllDealershipDto } from "../../../../application/dealership/find-all-dealership-use-case/find-all-dealership.dto";
import { FindAllDealershipUseCase } from "../../../../application/dealership/find-all-dealership-use-case/find-all-dealership.use-case";
import { V1_DEALERSHIPS } from "../../../route.constants";

import { FindAllDealershipsHttpDto } from "./find-all-dealerships.http-dto";

@Controller(V1_DEALERSHIPS)
export class FindAllDealershipsController {
  constructor(private readonly find_all_dealership_use_case: FindAllDealershipUseCase) {}

  @Get()
  run(@Query() find_all_dealerships_http_dto: FindAllDealershipsHttpDto) {
    const find_all_dealership_dto = Object.assign(
      new FindAllDealershipDto(),
      find_all_dealerships_http_dto,
    );
    return this.find_all_dealership_use_case.execute(find_all_dealership_dto);
  }
}
