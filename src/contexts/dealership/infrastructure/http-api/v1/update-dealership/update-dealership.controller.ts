import { Body, Controller, Param, Patch } from "@nestjs/common";

import { UpdateDealershipUseCase } from "../../../../application/dealership/update-dealership-use-case/update-dealership.use-case";
import { V1_DEALERSHIPS } from "../../../route.constants";

import { FindDealershipHttpDto } from "../find-one-dealership/find-one-dealership.http-dto";
import { UpdateDealershipHttpDto } from "./update-dealership.http-dto";

@Controller(V1_DEALERSHIPS)
export class UpdateDealershipController {
  constructor(private readonly update_dealership_use_case: UpdateDealershipUseCase) {}

  @Patch(":id")
  run(
    @Param() params: FindDealershipHttpDto,
    @Body() update_dealership_http_dto: UpdateDealershipHttpDto,
  ) {
    return this.update_dealership_use_case.execute({
      id: params.id,
      ...update_dealership_http_dto,
    });
  }
}
