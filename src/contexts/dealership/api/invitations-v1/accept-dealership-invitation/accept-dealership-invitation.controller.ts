import { Controller, Get, HttpStatus, Query, Res } from "@nestjs/common";
import { Response } from "express";

import { getFrontendUrl } from "@/src/common/frontend-routes";
import { DealershipInvitationsService } from "@/src/contexts/dealership/services/dealership-invitations.service";

import { V1_DEALERSHIP_INVITATIONS } from "../../route.constants";
import { AcceptDealershipInvitationHttpDto } from "./accept-dealership-invitation.http-dto";

@Controller(V1_DEALERSHIP_INVITATIONS)
export class AcceptDealershipInvitationController {
  constructor(
    private readonly dealership_invitations_service: DealershipInvitationsService,
  ) {}

  /** Aceptación vía enlace del correo (token en query). Sin JWT. */
  @Get("accept")
  async run(
    @Query() query: AcceptDealershipInvitationHttpDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { mustCreateProfile, email, invitation_id } =
      await this.dealership_invitations_service.accept(query.token);

    if (query.with_response) {
      return { mustCreateProfile, email, invitation_id };
    }

    const url = mustCreateProfile
      ? `${getFrontendUrl("REGISTER")}?email=${encodeURIComponent(email)}`
      : `${getFrontendUrl("TEAM")}?invitation=${encodeURIComponent(invitation_id)}`;

    res.redirect(HttpStatus.FOUND, url);
  }
}
