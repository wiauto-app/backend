import { Controller, Delete, HttpCode, HttpStatus, Param } from "@nestjs/common";

import { DealershipInvitationsService } from "@/src/contexts/dealership/services/dealership-invitations.service";
import { AuthPermissions } from "@/src/contexts/users/permissions/decorators/authPermission.decorator";
import { PermissionKeys } from "@/src/contexts/users/permissions/lib/available-permission";

import { DealershipTeamManagerGuard } from "../../../guards/dealership-team-manager.guard";
import { V1_DEALERSHIP_INVITATIONS } from "../../route.constants";
import { RevokeDealershipInvitationHttpDto } from "./revoke-dealership-invitation.http-dto";

@Controller(V1_DEALERSHIP_INVITATIONS)
export class RevokeDealershipInvitationController {
  constructor(
    private readonly dealership_invitations_service: DealershipInvitationsService,
  ) {}

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @AuthPermissions({
    permissions: [PermissionKeys.DEALERSHIPINVITATIONS_DELETE],
    extraGuards: [DealershipTeamManagerGuard],
  })
  run(@Param() params: RevokeDealershipInvitationHttpDto) {
    return this.dealership_invitations_service.revoke(params.id);
  }
}
