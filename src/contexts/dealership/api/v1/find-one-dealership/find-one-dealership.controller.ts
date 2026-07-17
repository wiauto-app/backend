import { Controller, Get, Param } from "@nestjs/common";

import { DealershipService } from "../../../services/dealership.service";
import { V1_DEALERSHIPS } from "../../route.constants";

import { FindDealershipHttpDto } from "./find-one-dealership.http-dto";

@Controller(V1_DEALERSHIPS)
export class FindDealershipController {
  constructor(private readonly dealership_service: DealershipService) {}

  @Get(":id")
  run(@Param() params: FindDealershipHttpDto) {
    return this.dealership_service.findOne({ id: params.id });
  }
}
