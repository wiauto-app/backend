import { Body, Controller, Param, Patch } from "@nestjs/common";

import { DealershipMemberInputDto } from "../../../dto/dealership-member-input.dto";
import { DealershipService } from "../../../services/dealership.service";
import { AuthPermissions } from "@/src/contexts/users/permissions/decorators/authPermission.decorator";
import { DealershipTeamManagerGuard } from "../../../guards/dealership-team-manager.guard";
import { V1_DEALERSHIPS } from "../../route.constants";

import { FindDealershipHttpDto } from "../find-one-dealership/find-one-dealership.http-dto";
import { UpdateDealershipHttpDto } from "./update-dealership.http-dto";

@Controller(V1_DEALERSHIPS)
export class UpdateDealershipController {
  constructor(private readonly dealership_service: DealershipService) {}

  @Patch(":id")
  @AuthPermissions({ permissions: [], extraGuards: [DealershipTeamManagerGuard] })
  run(
    @Param() params: FindDealershipHttpDto,
    @Body() update_dealership_http_dto: UpdateDealershipHttpDto,
  ) {
    const { members, ...dealership_fields } = update_dealership_http_dto;

    return this.dealership_service.update({
      id: params.id,
      ...dealership_fields,
      ...(members !== undefined
        ? {
            members: members.map(
              (member): DealershipMemberInputDto => ({
                profile_id: member.profile_id,
                role: member.role,
              }),
            ),
          }
        : {}),
    });
  }
}
