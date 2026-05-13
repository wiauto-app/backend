import { Controller, Get, HttpStatus, Query, Res } from "@nestjs/common";
import { Response } from "express";

import { RejectDealershipInvitationUseCase } from "@/src/contexts/dealership/application/dealership-invitation/reject-dealership-invitation-use-case/reject-dealership-invitation.use-case";
import { RejectDealershipInvitationDto } from "@/src/contexts/dealership/application/dealership-invitation/reject-dealership-invitation-use-case/reject-dealership-invitation.dto";
import { getFrontendUrl } from "@/src/common/frontend-routes";

import { V1_DEALERSHIP_INVITATIONS } from "../../../route.constants";

import { RejectDealershipInvitationHttpDto } from "./reject-dealership-invitation.http-dto";

@Controller(V1_DEALERSHIP_INVITATIONS)
export class RejectDealershipInvitationController {
  constructor(
    private readonly reject_dealership_invitation_use_case: RejectDealershipInvitationUseCase,
  ) {}

  /** Rechazo vía enlace (token en query). Sin JWT. Marca la invitación como revocada. */
  @Get("reject")
  async run(
    @Query() query: RejectDealershipInvitationHttpDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const reject_dealership_invitation_dto = Object.assign(
      new RejectDealershipInvitationDto(),
      { token: query.token },
    );
    const { email } = await this.reject_dealership_invitation_use_case.execute(
      reject_dealership_invitation_dto,
    );

    if (query.with_response) {
      return { email, rejected: true };
    }

    res.redirect(
      HttpStatus.FOUND,
      `${getFrontendUrl("INVITATION_REJECTED")}?email=${encodeURIComponent(email)}`,
    );
  }
}
