import { Controller, Get, Param } from "@nestjs/common";

import { FindOneDealershipUseCase } from "../../../../application/dealership/find-one-dealership-use-case/find-one-dealership.use-case";
import { V1_DEALERSHIPS } from "../../../route.constants";

import { FindDealershipHttpDto } from "./find-one-dealership.http-dto";

@Controller(V1_DEALERSHIPS)
export class FindDealershipController {
  constructor(private readonly find_one_dealership_use_case: FindOneDealershipUseCase) {}

  @Get(":id")
  run(@Param() params: FindDealershipHttpDto) {
    return this.find_one_dealership_use_case.execute({ id: params.id });
  }
}
