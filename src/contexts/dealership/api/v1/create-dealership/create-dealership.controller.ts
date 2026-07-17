import { Body, Controller, Post } from "@nestjs/common";

import { CreateDealershipDto } from "../../../dto/create-dealership.dto";
import { DealershipService } from "../../../services/dealership.service";
import { DealershipMemberInputDto } from "../../../dto/dealership-member-input.dto";
import { V1_DEALERSHIPS } from "../../route.constants";

import { CreateDealershipHttpDto } from "./create-dealership.http-dto";
import { AuthPermissions } from "@/src/contexts/users/permissions/decorators/authPermission.decorator";
import { PermissionKeys } from "@/src/contexts/users/permissions/lib/available-permission";

@Controller(V1_DEALERSHIPS)
@AuthPermissions({
  permissions: [PermissionKeys.DEALERSHIP_CREATE],
})
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
