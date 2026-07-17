import { Body, Controller, Post } from "@nestjs/common";

import { GetUserId } from "@/src/contexts/auth/decorators/GetUserId.decorator";
import { AuthPermissions } from "@/src/contexts/users/permissions/decorators/authPermission.decorator";

import { DealershipService } from "../../../services/dealership.service";
import { V1_DEALERSHIPS_MY_PROFILE } from "../../route.constants";

import { CreateMyDealershipHttpDto } from "./create-my-dealership.http-dto";

@Controller()
export class CreateMyDealershipController {
  constructor(private readonly dealership_service: DealershipService) {}

  @Post(V1_DEALERSHIPS_MY_PROFILE)
  @AuthPermissions({ permissions: [] })
  run(
    @GetUserId() profile_id: string,
    @Body() create_my_dealership_http_dto: CreateMyDealershipHttpDto,
  ) {
    return this.dealership_service.createMy(
      profile_id,
      create_my_dealership_http_dto,
    );
  }
}
