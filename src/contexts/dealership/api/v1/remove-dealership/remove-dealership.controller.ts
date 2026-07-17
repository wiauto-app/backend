import { Controller, Delete, HttpCode, HttpStatus, Param } from "@nestjs/common";

import { DealershipService } from "../../../services/dealership.service";
import { V1_DEALERSHIPS } from "../../route.constants";

import { FindDealershipHttpDto } from "../find-one-dealership/find-one-dealership.http-dto";

@Controller(V1_DEALERSHIPS)
export class RemoveDealershipController {
  constructor(private readonly dealership_service: DealershipService) {}

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  run(@Param() params: FindDealershipHttpDto) {
    return this.dealership_service.remove({ id: params.id });
  }
}
