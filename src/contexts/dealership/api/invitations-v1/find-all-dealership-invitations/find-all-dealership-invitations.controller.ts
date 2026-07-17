import { Controller, Get, Query } from "@nestjs/common";

import { DealershipInvitationsService } from "@/src/contexts/dealership/services/dealership-invitations.service";
import { AuthPermissions } from "@/src/contexts/users/permissions/decorators/authPermission.decorator";
import { PermissionKeys } from "@/src/contexts/users/permissions/lib/available-permission";

import { DealershipTeamManagerGuard } from "../../../guards/dealership-team-manager.guard";
import { V1_DEALERSHIP_INVITATIONS } from "../../route.constants";
import { FindAllDealershipInvitationsHttpDto } from "./find-all-dealership-invitations.http-dto";

@Controller(V1_DEALERSHIP_INVITATIONS)
export class FindAllDealershipInvitationsController {
  constructor(
    private readonly dealership_invitations_service: DealershipInvitationsService,
  ) {}

  @Get()
  @AuthPermissions({
    permissions: [PermissionKeys.DEALERSHIPINVITATIONS_CREATE],
    extraGuards: [DealershipTeamManagerGuard],
  })
  run(@Query() query: FindAllDealershipInvitationsHttpDto) {
    return this.dealership_invitations_service.findAll({
      dealership_id: query.dealership_id,
      status: query.status,
      page: query.page,
      limit: query.limit,
      query: query.query,
      order_by: query.order_by,
      order_direction: query.order_direction,
    });
  }
}
