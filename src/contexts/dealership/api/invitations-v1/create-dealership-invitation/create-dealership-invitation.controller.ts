import { Body, Controller, Post, UseGuards } from "@nestjs/common";

import { GetUserId } from "@/src/contexts/auth/decorators/GetUserId.decorator";
import { JwtGuard } from "@/src/contexts/auth/guards/auth.guard";
import { DealershipInvitationsService } from "@/src/contexts/dealership/services/dealership-invitations.service";

import { DealershipTeamManagerGuard } from "../../../guards/dealership-team-manager.guard";
import { V1_DEALERSHIP_INVITATIONS } from "../../route.constants";
import { CreateDealershipInvitationHttpDto } from "./create-dealership-invitation.http-dto";

@Controller(V1_DEALERSHIP_INVITATIONS)
export class CreateDealershipInvitationController {
  constructor(
    private readonly dealership_invitations_service: DealershipInvitationsService,
  ) {}

  @Post()
  @UseGuards(JwtGuard, DealershipTeamManagerGuard)
  run(
    @Body() body: CreateDealershipInvitationHttpDto,
    @GetUserId() invited_by_id: string,
  ) {
    return this.dealership_invitations_service.create({
      ...body,
      invited_by_id,
    });
  }
}
