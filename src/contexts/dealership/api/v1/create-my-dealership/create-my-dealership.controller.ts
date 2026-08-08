import { Body, Controller, Post, UseGuards } from "@nestjs/common";

import { GetUserId } from "@/src/contexts/auth/decorators/GetUserId.decorator";
import { JwtGuard } from "@/src/contexts/auth/guards/auth.guard";

import { DealershipService } from "../../../services/dealership.service";
import { V1_DEALERSHIPS_MY_PROFILE } from "../../route.constants";

import { CreateMyDealershipHttpDto } from "./create-my-dealership.http-dto";

@Controller()
export class CreateMyDealershipController {
  constructor(private readonly dealership_service: DealershipService) {}

  @Post(V1_DEALERSHIPS_MY_PROFILE)
  @UseGuards(JwtGuard)
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
