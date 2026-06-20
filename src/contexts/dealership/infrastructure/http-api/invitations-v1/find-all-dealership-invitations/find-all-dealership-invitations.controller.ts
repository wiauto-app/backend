import { Controller, Get, Query } from "@nestjs/common";

import { FindAllDealershipInvitationsUseCase } from "@/src/contexts/dealership/application/dealership-invitation/find-all-dealership-invitations-use-case/find-all-dealership-invitations.use-case";
import { FindAllDealershipInvitationsDto } from "@/src/contexts/dealership/application/dealership-invitation/find-all-dealership-invitations-use-case/find-all-dealership-invitations.dto";
import { AuthPermissions } from "@/src/contexts/users/permissions/decorators/authPermission.decorator";
import { PermissionKeys } from "@/src/contexts/users/permissions/lib/available-permission";

import { DealershipTeamManagerGuard } from "../../../guards/dealership-team-manager.guard";
import { V1_DEALERSHIP_INVITATIONS } from "../../../route.constants";

import { FindAllDealershipInvitationsHttpDto } from "./find-all-dealership-invitations.http-dto";

@Controller(V1_DEALERSHIP_INVITATIONS)
export class FindAllDealershipInvitationsController {
  constructor(
    private readonly find_all_dealership_invitations_use_case: FindAllDealershipInvitationsUseCase,
  ) {}

  @Get()
  @AuthPermissions({
    permissions: [PermissionKeys.DEALERSHIPINVITATIONS_CREATE],
    extraGuards: [DealershipTeamManagerGuard],
  })
  run(@Query() query: FindAllDealershipInvitationsHttpDto) {
    const dto = Object.assign(new FindAllDealershipInvitationsDto(), {
      dealership_id: query.dealership_id,
      status: query.status,
      page: query.page,
      limit: query.limit,
      query: query.query,
      order_by: query.order_by,
      order_direction: query.order_direction,
    });

    return this.find_all_dealership_invitations_use_case.execute(dto);
  }
}
