import { Controller, Delete, HttpCode, HttpStatus, Param } from "@nestjs/common";

import { RevokeDealershipInvitationUseCase } from "@/src/contexts/dealership/application/dealership-invitation/revoke-dealership-invitation-use-case/revoke-dealership-invitation.use-case";
import { RevokeDealershipInvitationDto } from "@/src/contexts/dealership/application/dealership-invitation/revoke-dealership-invitation-use-case/revoke-dealership-invitation.dto";
import { AuthPermissions } from "@/src/contexts/users/permissions/decorators/authPermission.decorator";
import { PermissionKeys } from "@/src/contexts/users/permissions/lib/available-permission";

import { DealershipTeamManagerGuard } from "../../../guards/dealership-team-manager.guard";
import { V1_DEALERSHIP_INVITATIONS } from "../../../route.constants";

import { RevokeDealershipInvitationHttpDto } from "./revoke-dealership-invitation.http-dto";

@Controller(V1_DEALERSHIP_INVITATIONS)
export class RevokeDealershipInvitationController {
  constructor(
    private readonly revoke_dealership_invitation_use_case: RevokeDealershipInvitationUseCase,
  ) {}

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @AuthPermissions({
    permissions: [PermissionKeys.DEALERSHIPINVITATIONS_DELETE],
    extraGuards: [DealershipTeamManagerGuard],
  })
  run(@Param() params: RevokeDealershipInvitationHttpDto) {
    const dto = Object.assign(new RevokeDealershipInvitationDto(), { id: params.id });
    return this.revoke_dealership_invitation_use_case.execute(dto);
  }
}
