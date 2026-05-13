import { forwardRef, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { ProfileModule } from "@/src/contexts/profiles/profile.module";

import { AcceptDealershipInvitationUseCase } from "../application/dealership-invitation/accept-dealership-invitation-use-case/accept-dealership-invitation.use-case";
import { RejectDealershipInvitationUseCase } from "../application/dealership-invitation/reject-dealership-invitation-use-case/reject-dealership-invitation.use-case";
import { CreateDealershipMembersUseCase } from "../application/dealership-members/create-dealership-members-use-case/dealership-members.use-case";
import { CreateDealershipInvitationUseCase } from "../application/dealership-invitation/create-dealership-invitation-use-case/create-dealership-invitation.use-case";
import { DealershipInvitationRepository } from "../domain/repositories/dealership-invitation.repository";
import { DealershipMemberRepository } from "../domain/repositories/dealership-member.repository";
import { AcceptDealershipInvitationController } from "../infrastructure/http-api/invitations-v1/accept-dealership-invitation/accept-dealership-invitation.controller";
import { RejectDealershipInvitationController } from "../infrastructure/http-api/invitations-v1/reject-dealership-invitation/reject-dealership-invitation.controller";
import { CreateDealershipInvitationController } from "../infrastructure/http-api/invitations-v1/create-dealership-invitation/create-dealership-invitation.controller";
import { DealershipInvitationsEntity } from "../infrastructure/persistence/dealership-invitations.entity";
import { DealershipMembersEntity } from "../infrastructure/persistence/dealership-members.entity";
import { TypeOrmDealershipInvitationRepository } from "../infrastructure/repositories/typeorm.dealership-invitation-repository";
import { TypeOrmDealershipMemberRepository } from "../infrastructure/repositories/typeorm.dealership-member-repository";
import { DealershipInvitationEmailService } from "../domain/services/dealership-invitation-email.service";
import { DealershipInvitationMailService } from "../infrastructure/services/dealership-invitation-mail.service";
import { DealerShipOwnerGuard } from "../infrastructure/guards/dealer-ship-owner.guard.ts";

@Module({
  imports: [
    TypeOrmModule.forFeature([DealershipInvitationsEntity, DealershipMembersEntity]),
    forwardRef(() => ProfileModule),
  ],
  controllers: [
    CreateDealershipInvitationController,
    AcceptDealershipInvitationController,
    RejectDealershipInvitationController,
  ],
  providers: [
    DealerShipOwnerGuard,
    AcceptDealershipInvitationUseCase,
    RejectDealershipInvitationUseCase,
    CreateDealershipInvitationUseCase,
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
  ],
})
export class DealershipInvitationModule {}