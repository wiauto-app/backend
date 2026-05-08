import { Body, Controller, Post } from "@nestjs/common";

import { CreateDealershipInvitationUseCase } from "@/src/contexts/dealership/application/dealership-invitation/create-dealership-invitation-use-case/create-dealership-invitation.use-case";
import { CreateDealershipInvitationDto } from "@/src/contexts/dealership/application/dealership-invitation/create-dealership-invitation-use-case/create-dealership-invitation.dto";
import { GetUserId } from "@/src/contexts/auth/decorators/GetUserId.decorator";
import { AuthPermissions } from "@/src/contexts/users/permissions/decorators/authPermission.decorator";
import { PermissionKeys } from "@/src/contexts/users/permissions/lib/available-permission";
import { V1_DEALERSHIP_INVITATIONS } from "../../../route.constants";

import { CreateDealershipInvitationHttpDto } from "./create-dealership-invitation.http-dto";

@Controller(V1_DEALERSHIP_INVITATIONS)
export class CreateDealershipInvitationController {
  constructor(private readonly create_dealership_invitation_use_case: CreateDealershipInvitationUseCase) {}

  @Post()
  @AuthPermissions(PermissionKeys.DEALERSHIPINVITATIONS_CREATE)
  run(
    @Body() create_dealership_invitation_http_dto: CreateDealershipInvitationHttpDto,
    @GetUserId() invited_by_id: string,
  ) {
    const create_dealership_invitation_dto = Object.assign(
      new CreateDealershipInvitationDto(),
      create_dealership_invitation_http_dto,
      { invited_by_id },
    );
    return this.create_dealership_invitation_use_case.execute(create_dealership_invitation_dto);
  }
}