import { Controller, Get, Param, UseGuards } from "@nestjs/common";

import { GetUserId } from "@/src/contexts/auth/decorators/GetUserId.decorator";
import { JwtGuard } from "@/src/contexts/auth/guards/auth.guard";
import { DealershipInvitationsService } from "@/src/contexts/dealership/services/dealership-invitations.service";

import { V1_DEALERSHIP_INVITATIONS } from "../../route.constants";
import { GetDealershipInvitationJoinStatusHttpDto } from "./get-dealership-invitation-join-status.http-dto";

@Controller(V1_DEALERSHIP_INVITATIONS)
export class GetDealershipInvitationJoinStatusController {
  constructor(
    private readonly dealership_invitations_service: DealershipInvitationsService,
  ) {}

  /** Valida si la invitación aceptada pertenece al usuario de la sesión actual. */
  @Get(":id/join-status")
  @UseGuards(JwtGuard)
  run(
    @Param() params: GetDealershipInvitationJoinStatusHttpDto,
    @GetUserId() user_id: string,
  ) {
    return this.dealership_invitations_service.getJoinStatus(
      params.id,
      user_id,
    );
  }
}
