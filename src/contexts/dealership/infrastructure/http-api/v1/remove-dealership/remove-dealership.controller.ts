import { Controller, Delete, HttpCode, HttpStatus, Param } from "@nestjs/common";

import { RemoveDealershipUseCase } from "../../../../application/dealership/remove-dealership-use-case/remove-dealership.use-case";
import { V1_DEALERSHIPS } from "../../../route.constants";

import { FindDealershipHttpDto } from "../find-one-dealership/find-one-dealership.http-dto";

@Controller(V1_DEALERSHIPS)
export class RemoveDealershipController {
  constructor(private readonly remove_dealership_use_case: RemoveDealershipUseCase) {}

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  run(@Param() params: FindDealershipHttpDto) {
    return this.remove_dealership_use_case.execute({ id: params.id });
  }
}
