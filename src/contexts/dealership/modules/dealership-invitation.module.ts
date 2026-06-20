import { forwardRef, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { ProfileModule } from "@/src/contexts/profiles/profile.module";

import { AcceptDealershipInvitationUseCase } from "../application/dealership-invitation/accept-dealership-invitation-use-case/accept-dealership-invitation.use-case";
import { CreateDealershipInvitationUseCase } from "../application/dealership-invitation/create-dealership-invitation-use-case/create-dealership-invitation.use-case";
import { FindAllDealershipInvitationsUseCase } from "../application/dealership-invitation/find-all-dealership-invitations-use-case/find-all-dealership-invitations.use-case";
import { RejectDealershipInvitationUseCase } from "../application/dealership-invitation/reject-dealership-invitation-use-case/reject-dealership-invitation.use-case";
import { RevokeDealershipInvitationUseCase } from "../application/dealership-invitation/revoke-dealership-invitation-use-case/revoke-dealership-invitation.use-case";
import { CreateDealershipMembersUseCase } from "../application/dealership-members/create-dealership-members-use-case/dealership-members.use-case";
import { DealershipInvitationRepository } from "../domain/repositories/dealership-invitation.repository";
import { DealershipMemberRepository } from "../domain/repositories/dealership-member.repository";
import { DealershipInvitationEmailService } from "../domain/services/dealership-invitation-email.service";
import { DealershipMemberGuard } from "../infrastructure/guards/dealership-member.guard";
import { DealershipMemberSelfGuard } from "../infrastructure/guards/dealership-member-self.guard";
import { DealershipTeamManagerGuard } from "../infrastructure/guards/dealership-team-manager.guard";
import { AcceptDealershipInvitationController } from "../infrastructure/http-api/invitations-v1/accept-dealership-invitation/accept-dealership-invitation.controller";
import { CreateDealershipInvitationController } from "../infrastructure/http-api/invitations-v1/create-dealership-invitation/create-dealership-invitation.controller";
import { FindAllDealershipInvitationsController } from "../infrastructure/http-api/invitations-v1/find-all-dealership-invitations/find-all-dealership-invitations.controller";
import { RejectDealershipInvitationController } from "../infrastructure/http-api/invitations-v1/reject-dealership-invitation/reject-dealership-invitation.controller";
import { RevokeDealershipInvitationController } from "../infrastructure/http-api/invitations-v1/revoke-dealership-invitation/revoke-dealership-invitation.controller";
import { DealershipInvitationsEntity } from "../infrastructure/persistence/dealership-invitations.entity";
import { DealershipMembersEntity } from "../infrastructure/persistence/dealership-members.entity";
import { TypeOrmDealershipInvitationRepository } from "../infrastructure/repositories/typeorm.dealership-invitation-repository";
import { TypeOrmDealershipMemberRepository } from "../infrastructure/repositories/typeorm.dealership-member-repository";
import { DealershipInvitationMailService } from "../infrastructure/services/dealership-invitation-mail.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([DealershipInvitationsEntity, DealershipMembersEntity]),
    forwardRef(() => ProfileModule),
  ],
  controllers: [
    CreateDealershipInvitationController,
    FindAllDealershipInvitationsController,
    RevokeDealershipInvitationController,
    AcceptDealershipInvitationController,
    RejectDealershipInvitationController,
  ],
  providers: [
    DealershipTeamManagerGuard,
    DealershipMemberGuard,
    DealershipMemberSelfGuard,
    AcceptDealershipInvitationUseCase,
    RejectDealershipInvitationUseCase,
    CreateDealershipInvitationUseCase,
    FindAllDealershipInvitationsUseCase,
    RevokeDealershipInvitationUseCase,
    CreateDealershipMembersUseCase,
    TypeOrmDealershipInvitationRepository,
    TypeOrmDealershipMemberRepository,
    DealershipInvitationMailService,
    {
      provide: DealershipInvitationRepository,
      useExisting: TypeOrmDealershipInvitationRepository,
    },
    {
      provide: DealershipInvitationEmailService,
      useExisting: DealershipInvitationMailService,
    },
    {
      provide: DealershipMemberRepository,
      useExisting: TypeOrmDealershipMemberRepository,
    },
  ],
  exports: [
    DealershipInvitationRepository,
    DealershipMemberRepository,
    CreateDealershipMembersUseCase,
    DealershipTeamManagerGuard,
    DealershipMemberGuard,
    DealershipMemberSelfGuard,
  ],
})
export class DealershipInvitationModule {}
