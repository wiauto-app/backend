import { Controller, Get, Query } from "@nestjs/common";

import { FindAllDealershipDto } from "../../../dto/find-all-dealership.dto";
import { DealershipService } from "../../../services/dealership.service";
import { V1_DEALERSHIPS } from "../../route.constants";

import { FindAllDealershipsHttpDto } from "./find-all-dealerships.http-dto";

@Controller(V1_DEALERSHIPS)
export class FindAllDealershipsController {
  constructor(private readonly dealership_service: DealershipService) {}

  @Get()
  run(@Query() find_all_dealerships_http_dto: FindAllDealershipsHttpDto) {
    const find_all_dealership_dto = Object.assign(
      new FindAllDealershipDto(),
      find_all_dealerships_http_dto,
    );
    return this.dealership_service.findAll(find_all_dealership_dto);
  }
}
