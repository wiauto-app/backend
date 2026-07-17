import { Controller, Get, HttpStatus, Query, Res } from "@nestjs/common";
import { Response } from "express";

import { getFrontendUrl } from "@/src/common/frontend-routes";
import { DealershipInvitationsService } from "@/src/contexts/dealership/services/dealership-invitations.service";

import { V1_DEALERSHIP_INVITATIONS } from "../../route.constants";
import { RejectDealershipInvitationHttpDto } from "./reject-dealership-invitation.http-dto";

@Controller(V1_DEALERSHIP_INVITATIONS)
export class RejectDealershipInvitationController {
  constructor(
    private readonly dealership_invitations_service: DealershipInvitationsService,
  ) {}

  /** Rechazo vía enlace (token en query). Sin JWT. Marca la invitación como revocada. */
  @Get("reject")
  async run(
    @Query() query: RejectDealershipInvitationHttpDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { email } = await this.dealership_invitations_service.reject(query.token);

    if (query.with_response) {
      return { email, rejected: true };
    }

    res.redirect(
      HttpStatus.FOUND,
      `${getFrontendUrl("INVITATION_REJECTED")}?email=${encodeURIComponent(email)}`,
    );
  }
}
