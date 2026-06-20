import { Controller, Get, HttpStatus, Query, Res } from "@nestjs/common";

import { AcceptDealershipInvitationUseCase } from "@/src/contexts/dealership/application/dealership-invitation/accept-dealership-invitation-use-case/accept-dealership-invitation.use-case";
import { AcceptDealershipInvitationDto } from "@/src/contexts/dealership/application/dealership-invitation/accept-dealership-invitation-use-case/accept-dealership-invitation.dto";
import { V1_DEALERSHIP_INVITATIONS } from "../../../route.constants";

import { AcceptDealershipInvitationHttpDto } from "./accept-dealership-invitation.http-dto";
import { Response } from "express";
import { getFrontendUrl } from "@/src/common/frontend-routes";

@Controller(V1_DEALERSHIP_INVITATIONS)
export class AcceptDealershipInvitationController {
  constructor(
    private readonly accept_dealership_invitation_use_case: AcceptDealershipInvitationUseCase,
  ) { }

  /** Aceptación vía enlace del correo (token en query). Sin JWT. */
  @Get("accept")
  async run(
    @Query() query: AcceptDealershipInvitationHttpDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const accept_dealership_invitation_dto = Object.assign(
      new AcceptDealershipInvitationDto(),
      { token: query.token },
    );
    const { must_create, email } = await this.accept_dealership_invitation_use_case.execute(
      accept_dealership_invitation_dto,
    );

    if (query.with_response) {
      return {
        must_create,
        email,
      };
    }

    if (must_create) {
      res.redirect(HttpStatus.FOUND, `${getFrontendUrl("REGISTER")}?email=${encodeURIComponent(email)}`);
    } else {
      res.redirect(HttpStatus.FOUND, `${getFrontendUrl("TEAM")}?joined=1`);
    }

  }
}
