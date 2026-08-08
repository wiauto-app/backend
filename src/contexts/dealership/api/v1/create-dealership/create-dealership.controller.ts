import { Body, Controller, Post } from "@nestjs/common";

import { AuthAdmin } from "@/src/contexts/auth/decorators/auth-admin.decorator";
import { CreateDealershipDto } from "../../../dto/create-dealership.dto";
import { DealershipService } from "../../../services/dealership.service";
import { DealershipMemberInputDto } from "../../../dto/dealership-member-input.dto";
import { V1_DEALERSHIPS } from "../../route.constants";

import { CreateDealershipHttpDto } from "./create-dealership.http-dto";

@Controller(V1_DEALERSHIPS)
@AuthAdmin()
export class CreateDealershipController {
  constructor(private readonly dealership_service: DealershipService) {}

  @Post()
  run(@Body() create_dealership_http_dto: CreateDealershipHttpDto) {
    const create_dealership_dto = Object.assign(new CreateDealershipDto(), {
      ...create_dealership_http_dto,
      members: create_dealership_http_dto.members.map(
        (member): DealershipMemberInputDto => ({
          profile_id: member.profile_id,
          role: member.role,
        }),
      ),
    });
    return this.dealership_service.create(create_dealership_dto);
  }
}
