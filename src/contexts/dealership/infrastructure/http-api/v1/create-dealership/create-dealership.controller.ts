import { Body, Controller, Post } from "@nestjs/common";

import { CreateDealershipDto } from "../../../../application/dealership/create-dealership-use-case/create-dealership.dto";
import { CreateDealershipUseCase } from "../../../../application/dealership/create-dealership-use-case/create-dealership.use-case";
import { DealershipMemberInputDto } from "../../../../application/dealership/dealership-member-input.dto";
import { V1_DEALERSHIPS } from "../../../route.constants";

import { CreateDealershipHttpDto } from "./create-dealership.http-dto";
import { AuthPermissions } from "@/src/contexts/users/permissions/decorators/authPermission.decorator";
import { PermissionKeys } from "@/src/contexts/users/permissions/lib/available-permission";

@Controller(V1_DEALERSHIPS)
@AuthPermissions({
  permissions: [PermissionKeys.DEALERSHIP_CREATE],
})
export class CreateDealershipController {
  constructor(private readonly create_dealership_use_case: CreateDealershipUseCase) {}

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
    return this.create_dealership_use_case.execute(create_dealership_dto);
  }
}
