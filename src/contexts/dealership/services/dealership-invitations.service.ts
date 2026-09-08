import {
  BadRequestException,
  ForbiddenException,
  Inject,
  UnauthorizedException,
  forwardRef,
} from "@nestjs/common";

import { TypeOrmProfileUserRepository } from "@/src/contexts/profiles/repositories/typeorm.profile-user-repository";
import { ProfileService } from "@/src/contexts/profiles/services/profile.service";
import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { PaginatedResult } from "@/src/contexts/shared/types/paginated-result.vo";
import { OutboundMailEnqueueService } from "@/src/contexts/shared/mail/outbound-mail-enqueue.service";
import { generateToken } from "@/src/contexts/shared/token_management/generate_token";
import { hashToken } from "@/src/contexts/shared/token_management/hash_token";

import { DealershipInvitationsEntity } from "../entities/dealership-invitations.entity";
import { DealershipMembersEntity } from "../entities/dealership-members.entity";
import { InvitationAlreadyAcceptedException } from "../exceptions/invitation-already-accepted.exception";
import { InvitationExpiredException } from "../exceptions/invitation-expired.exception";
import { InvitationNotFoundException } from "../exceptions/invitation-not-found.exception";
import { InvitationNotPendingException } from "../exceptions/invitation-not-pending.exception";
import { InvitationRevokedException } from "../exceptions/invitation-revoked.exception";
import { DealershipInvitationsFilter } from "../types/dealership-invitation.filter";
import { TypeOrmDealershipInvitationRepository } from "@/src/contexts/dealership/repositories/typeorm.dealership-invitation-repository";
import { TypeOrmDealershipMemberRepository } from "@/src/contexts/dealership/repositories/typeorm.dealership-member-repository";
import { DealershipInvitationMailService } from "../services/dealership-invitation-mail.service";
import { CreateDealershipInvitationHttpDto } from "../api/invitations-v1/create-dealership-invitation/create-dealership-invitation.http-dto";
import { ProfileNotFoundException } from "../../profiles/exceptions/profile-not-found.exception";
import { DealershipInvitationJoinStatusResponse } from "../dto/dealership-invitation-join-status.response";

const dealership_member_roles = new Set<DealershipMembersEntity["role"]>([
  "owner",
  "admin",
  "member",
]);

export interface FindAllDealershipInvitationsInput {
  dealership_id: string;
  status?: string;
  page?: number;
  limit?: number;
  query?: string;
  order_by?: string;
  order_direction?: "ASC" | "DESC";
}

@Injectable()
export class DealershipInvitationsService {
  constructor(
    private readonly dealership_invitation_repository: TypeOrmDealershipInvitationRepository,
    private readonly dealership_member_repository: TypeOrmDealershipMemberRepository,
    private readonly profile_user_repository: TypeOrmProfileUserRepository,
    @Inject(forwardRef(() => ProfileService))
    private readonly profile_service: ProfileService,
    private readonly dealership_invitation_mail_service: DealershipInvitationMailService,
    private readonly outbound_mail_enqueue_service: OutboundMailEnqueueService,
  ) { }

  async create(
    dto: CreateDealershipInvitationHttpDto,
    invited_by_id: string,
  ): Promise<DealershipInvitationsEntity> {
    const accepted_invitation =
      await this.dealership_invitation_repository.findAcceptedByEmail(
        dto.email,
      );
    if (accepted_invitation) {
      throw new InvitationAlreadyAcceptedException();
    }

    const member =
      await this.dealership_member_repository.findOneByProfileId(invited_by_id);
    if (!member) {
      throw new ForbiddenException("No perteneces a este equipo");
    }

    if (member.profile.user.email === dto.email) {
      throw new ForbiddenException("No te puedes invitar a ti mismo");
    }

    const dealership_id = member.dealership_id;
    const pending_invitation =
      await this.dealership_invitation_repository.findPendingByEmailAndDealershipId(
        dto.email,
        dealership_id,
      );

    if (pending_invitation) {
      await this.dealership_invitation_repository.update(
        pending_invitation.id,
        { status: "revoked" },
      );
    }

    const invitedProfile = await this.profile_service.findByEmail(dto.email);
    if (invitedProfile) {
      const member = await this.dealership_member_repository.findOneByProfileId(invitedProfile.id);
      if (member && member.dealership_id === dealership_id) {
        throw new ForbiddenException("Este usuario ya pertenece a este equipo");
      }
      if (member && member.dealership_id !== dealership_id) {
        throw new ForbiddenException("Este usuario ya pertenece a otro equipo");
      }
    }
    const token = generateToken();
    const token_hash = hashToken(token);
    const dealership_invitation =
      await this.dealership_invitation_repository.save({
        email: dto.email,
        role: dto.role,
        dealership_id,
        invited_by_id: invited_by_id,
        token_hash,
        status: "pending",
        expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24),
        accepted_at: null,
      });

    await this.dealership_invitation_mail_service.send_invitation_email({
      invited_email: dto.email,
      invited_role: dto.role,
      dealership_id,
      invitation_token: token,
    });

    return dealership_invitation;
  }

  async findAll(
    input: FindAllDealershipInvitationsInput,
  ): Promise<PaginatedResult<DealershipInvitationsEntity>> {
    const filter = new DealershipInvitationsFilter({
      dealership_id: input.dealership_id,
      status: input.status as never,
      page: input.page ?? 1,
      limit: input.limit ?? 20,
      order_by: "created_at",
      order_direction: "DESC",
    });
    return this.dealership_invitation_repository.findAll(filter);
  }

  async accept(token: string): Promise<{
    mustCreateProfile: boolean;
    email: string;
    invitation_id: string;
  }> {
    const token_hash = hashToken(token);
    const dealership_invitation =
      await this.dealership_invitation_repository.findOneByTokenHash(
        token_hash,
      );
    if (!dealership_invitation) {
      throw new InvitationNotFoundException(token_hash);
    }
    if (dealership_invitation.expires_at < new Date()) {
      throw new InvitationExpiredException();
    }
    if (dealership_invitation.accepted_at !== null) {
      throw new InvitationAlreadyAcceptedException();
    }
    if (dealership_invitation.status === "revoked") {
      throw new InvitationRevokedException();
    }

    const email = dealership_invitation.email;
    const profile_exists =
      await this.profile_user_repository.existsByEmail(email);
    let added_to_team = false;

    if (profile_exists) {
      const profile = await this.profile_service.findByEmail(email);
      if (!profile) {
        throw new ProfileNotFoundException(email);
      }
      const dealership_member_exists =
        await this.dealership_member_repository.existsByDealershipIdAndProfileId(
          dealership_invitation.dealership_id,
          profile.id,
        );
      if (!dealership_member_exists) {
        const member_role = this.toDealershipMemberRole(
          dealership_invitation.role,
        );
        await this.dealership_member_repository.save({
          dealership_id: dealership_invitation.dealership_id,
          profile_id: profile.id,
          role: member_role,
        });
        added_to_team = true;
      }
    }

    await this.dealership_invitation_repository.update(
      dealership_invitation.id,
      {
        status: "accepted",
        accepted_at: new Date(),
      },
    );

    if (added_to_team) {
      await this.outbound_mail_enqueue_service.enqueue_dealership_team_joined({
        to: email,
        role: dealership_invitation.role,
        dealership_id: dealership_invitation.dealership_id,
      });
    }

    return {
      mustCreateProfile: !profile_exists,
      email,
      invitation_id: dealership_invitation.id,
    };
  }

  async reject(token: string): Promise<{ email: string }> {
    const token_hash = hashToken(token);
    const dealership_invitation =
      await this.dealership_invitation_repository.findOneByTokenHash(
        token_hash,
      );

    if (!dealership_invitation) {
      throw new InvitationNotFoundException(token_hash);
    }
    if (dealership_invitation.expires_at < new Date()) {
      throw new InvitationExpiredException();
    }
    if (dealership_invitation.accepted_at !== null) {
      throw new InvitationAlreadyAcceptedException();
    }
    if (dealership_invitation.status === "revoked") {
      throw new InvitationRevokedException();
    }

    const email = dealership_invitation.email;
    await this.dealership_invitation_repository.update(
      dealership_invitation.id,
      {
        status: "revoked",
      },
    );
    return { email };
  }

  async deleteInvitationsByEmail(email: string): Promise<void> {
    await this.dealership_invitation_repository.deleteByEmail(email);
  }

  async getJoinStatus(
    invitation_id: string,
    current_user_id: string,
  ): Promise<DealershipInvitationJoinStatusResponse> {
    const invitation =
      await this.dealership_invitation_repository.findOneWithDealership(
        invitation_id,
      );
    if (!invitation) {
      throw new InvitationNotFoundException(invitation_id);
    }

    const current_user_email =
      await this.profile_user_repository.findEmailById(current_user_id);
    if (!current_user_email) {
      throw new UnauthorizedException("Usuario no encontrado");
    }

    const invited_email = invitation.email;
    const belongs_to_current_user =
      invited_email.toLowerCase() === current_user_email.toLowerCase();

    return {
      invitation_id: invitation.id,
      belongs_to_current_user,
      invited_email,
      current_user_email,
      dealership_id: invitation.dealership_id,
      dealership_name: invitation.dealership.name,
      status: invitation.status,
    };
  }

  async revoke(id: string): Promise<void> {
    const invitation = await this.dealership_invitation_repository.findOne(id);
    if (!invitation) {
      throw new InvitationNotFoundException(id);
    }

    if (invitation.status !== "pending") {
      throw new InvitationNotPendingException(id);
    }

    await this.dealership_invitation_repository.update(invitation.id, {
      status: "revoked",
    });
  }

  private toDealershipMemberRole(
    role: string,
  ): DealershipMembersEntity["role"] {
    if (dealership_member_roles.has(role as DealershipMembersEntity["role"])) {
      return role as DealershipMembersEntity["role"];
    }
    throw new BadRequestException(
      `La invitación tiene un rol inválido: ${role}`,
    );
  }


}
