import { Body, Controller, Post } from "@nestjs/common";

import { GetUserId } from "@/src/contexts/auth/decorators/GetUserId.decorator";
import { AuthPermissions } from "@/src/contexts/users/permissions/decorators/authPermission.decorator";

import { CreateMyDealershipUseCase } from "../../../../application/dealership/create-my-dealership-use-case/create-my-dealership.use-case";
import { V1_DEALERSHIPS_MY_PROFILE } from "../../../route.constants";

import { CreateMyDealershipHttpDto } from "./create-my-dealership.http-dto";

@Controller()
export class CreateMyDealershipController {
  constructor(private readonly create_my_dealership_use_case: CreateMyDealershipUseCase) {}

  @Post(V1_DEALERSHIPS_MY_PROFILE)
  @AuthPermissions({ permissions: [] })
  run(
    @GetUserId() profile_id: string,
    @Body() create_my_dealership_http_dto: CreateMyDealershipHttpDto,
  ) {
    return this.create_my_dealership_use_case.execute(
      profile_id,
      create_my_dealership_http_dto,
    );
  }
}
