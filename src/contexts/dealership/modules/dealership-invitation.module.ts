import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { CreateDealershipMembersUseCase } from "../application/dealership-members/create-dealership-members-use-case/dealership-members.use-case";
import { CreateDealershipInvitationUseCase } from "../application/dealership-invitation/create-dealership-invitation-use-case/create-dealership-invitation.use-case";
import { DealershipInvitationRepository } from "../domain/repositories/dealership-invitation.repository";
import { DealershipMemberRepository } from "../domain/repositories/dealership-member.repository";
import { CreateDealershipInvitationController } from "../infrastructure/http-api/invitations-v1/create-dealership-invitation/create-dealership-invitation.controller";
import { DealershipInvitationsEntity } from "../infrastructure/persistence/dealership-invitations.entity";
import { DealershipMembersEntity } from "../infrastructure/persistence/dealership-members.entity";
import { TypeOrmDealershipInvitationRepository } from "../infrastructure/repositories/typeorm.dealership-invitation-repository";
import { TypeOrmDealershipMemberRepository } from "../infrastructure/repositories/typeorm.dealership-member-repository";

@Module({
  imports: [TypeOrmModule.forFeature([DealershipInvitationsEntity, DealershipMembersEntity])],
  controllers: [CreateDealershipInvitationController],
  providers: [
    CreateDealershipInvitationUseCase,
    CreateDealershipMembersUseCase,
    TypeOrmDealershipInvitationRepository,
    TypeOrmDealershipMemberRepository,
    {
      provide: DealershipInvitationRepository,
      useExisting: TypeOrmDealershipInvitationRepository,
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