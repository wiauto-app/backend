import { forwardRef, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { ProfileModule } from "@/src/contexts/profiles/profile.module";

import { TypeOrmDealershipInvitationRepository } from "@/src/contexts/dealership/repositories/typeorm.dealership-invitation-repository";
import { TypeOrmDealershipMemberRepository } from "@/src/contexts/dealership/repositories/typeorm.dealership-member-repository";
import { DealershipMemberGuard } from "../guards/dealership-member.guard";
import { DealershipMemberSelfGuard } from "../guards/dealership-member-self.guard";
import { DealershipTeamManagerGuard } from "../guards/dealership-team-manager.guard";
import { AcceptDealershipInvitationController } from "../api/invitations-v1/accept-dealership-invitation/accept-dealership-invitation.controller";
import { CreateDealershipInvitationController } from "../api/invitations-v1/create-dealership-invitation/create-dealership-invitation.controller";
import { FindAllDealershipInvitationsController } from "../api/invitations-v1/find-all-dealership-invitations/find-all-dealership-invitations.controller";
import { RejectDealershipInvitationController } from "../api/invitations-v1/reject-dealership-invitation/reject-dealership-invitation.controller";
import { RevokeDealershipInvitationController } from "../api/invitations-v1/revoke-dealership-invitation/revoke-dealership-invitation.controller";
import { DealershipInvitationsEntity } from "../entities/dealership-invitations.entity";
import { DealershipMembersEntity } from "../entities/dealership-members.entity";
import { DealershipInvitationMailService } from "../services/dealership-invitation-mail.service";
import { DealershipInvitationsService } from "../services/dealership-invitations.service";
import { DealershipMembersService } from "../services/dealership-members.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      DealershipInvitationsEntity,
      DealershipMembersEntity]),
    forwardRef(() => ProfileModule)],
  controllers: [
    CreateDealershipInvitationController,
    FindAllDealershipInvitationsController,
    RevokeDealershipInvitationController,
    AcceptDealershipInvitationController,
    RejectDealershipInvitationController],
  providers: [
    DealershipTeamManagerGuard,
    DealershipMemberGuard,
    DealershipMemberSelfGuard,
    DealershipInvitationsService,
    DealershipMembersService,
    TypeOrmDealershipInvitationRepository,
    TypeOrmDealershipMemberRepository,
    DealershipInvitationMailService
  ],
  exports: [
    TypeOrmDealershipInvitationRepository,
    TypeOrmDealershipMemberRepository,
    DealershipInvitationsService,
    DealershipMembersService,
    DealershipTeamManagerGuard,
    DealershipMemberGuard,
    DealershipMemberSelfGuard],
})
export class DealershipInvitationModule {}
