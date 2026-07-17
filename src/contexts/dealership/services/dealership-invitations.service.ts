import { BadRequestException, Inject, forwardRef } from "@nestjs/common";

import { TypeOrmProfileUserRepository } from "@/src/contexts/profiles/repositories/typeorm.profile-user-repository";
import { ProfileService } from "@/src/contexts/profiles/services/profile.service";
import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { PaginatedResult } from "@/src/contexts/shared/types/paginated-result.vo";
import { OutboundMailEnqueueService } from "@/src/contexts/shared/mail/outbound-mail-enqueue.service";
import { generateToken } from "@/src/contexts/shared/token_management/generate_token";
import { hashToken } from "@/src/contexts/shared/token_management/hash_token";

import { DealershipInvitation } from "../types/dealership-invitations";
import {
  DealershipMember,
  PrimitiveDealershipMember,
} from "../types/dealership-member";
import { InvitationAlreadyAcceptedException } from "../exceptions/invitation-already-accepted.exception";
import { InvitationExpiredException } from "../exceptions/invitation-expired.exception";
import { InvitationNotFoundException } from "../exceptions/invitation-not-found.exception";
import { InvitationNotPendingException } from "../exceptions/invitation-not-pending.exception";
import { InvitationRevokedException } from "../exceptions/invitation-revoked.exception";
import { DealershipInvitationsFilter } from "../types/dealership-invitation.filter";
import { TypeOrmDealershipInvitationRepository } from "@/src/contexts/dealership/repositories/typeorm.dealership-invitation-repository";
import { TypeOrmDealershipMemberRepository } from "@/src/contexts/dealership/repositories/typeorm.dealership-member-repository";
import { DealershipInvitationMailService } from "../services/dealership-invitation-mail.service";

const dealership_member_roles = new Set<PrimitiveDealershipMember["role"]>([
  "owner",
  "admin",
  "member"]);

export interface CreateDealershipInvitationInput {
  email: string;
  role: "owner" | "admin" | "member";
  dealership_id: string;
  invited_by_id: string;
}

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
  ) {}

  async create(input: CreateDealershipInvitationInput): Promise<void> {
    const accepted_invitation =
      await this.dealership_invitation_repository.findAcceptedByEmail(
        input.email,
      );
    if (accepted_invitation) {
      throw new InvitationAlreadyAcceptedException();
    }

    const pending_invitation =
      await this.dealership_invitation_repository.findPendingByEmailAndDealershipId(
        input.email,
        input.dealership_id,
      );

    if (pending_invitation) {
      const revoked = pending_invitation.update({ status: "revoked" });
      await this.dealership_invitation_repository.update(revoked);
    }

    const token = generateToken();
    const token_hash = hashToken(token);
    const dealership_invitation = DealershipInvitation.create({
      email: input.email,
      role: input.role,
      dealership_id: input.dealership_id,
      invited_by_id: input.invited_by_id,
      token_hash,
      status: "pending",
      expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24),
      accepted_at: null,
    });
    await this.dealership_invitation_repository.save(dealership_invitation);

    await this.dealership_invitation_mail_service.send_invitation_email({
      invited_email: input.email,
      invited_role: input.role,
      dealership_id: input.dealership_id,
      invitation_token: token,
    });
  }

  async findAll(
    input: FindAllDealershipInvitationsInput,
  ): Promise<PaginatedResult<DealershipInvitation>> {
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

  async accept(token: string): Promise<{ must_create: boolean; email: string }> {
    const token_hash = hashToken(token);
    const dealership_invitation =
      await this.dealership_invitation_repository.findOneByTokenHash(token_hash);
    if (!dealership_invitation) {
      throw new InvitationNotFoundException(token_hash);
    }
    if (dealership_invitation.is_expired()) {
      throw new InvitationExpiredException();
    }
    if (dealership_invitation.is_accepted()) {
      throw new InvitationAlreadyAcceptedException();
    }
    if (dealership_invitation.is_revoked()) {
      throw new InvitationRevokedException();
    }

    const email = dealership_invitation.toPrimitives().email;
    const profile_exists =
      await this.profile_user_repository.existsByEmail(email);
    let added_to_team = false;

    if (profile_exists) {
      const profile = await this.profile_service.findByEmail(email);
      const dealership_member_exists =
        await this.dealership_member_repository.existsByDealershipIdAndProfileId(
          dealership_invitation.dealership_id,
          profile.id,
        );
      if (!dealership_member_exists) {
        const member_role = this.toDealershipMemberRole(
          dealership_invitation.role,
        );
        const dealership_member = DealershipMember.create({
          dealership_id: dealership_invitation.dealership_id,
          profile_id: profile.id,
          role: member_role,
        });
        await this.dealership_member_repository.save(dealership_member);
        added_to_team = true;
      }
    }

    const accepted_invitation = dealership_invitation.update({
      status: "accepted",
      accepted_at: new Date(),
    });
    await this.dealership_invitation_repository.update(accepted_invitation);

    if (added_to_team) {
      await this.outbound_mail_enqueue_service.enqueue_dealership_team_joined({
        to: email,
        role: dealership_invitation.role,
        dealership_id: dealership_invitation.dealership_id,
      });
    }

    return { must_create: !profile_exists, email };
  }

  async reject(token: string): Promise<{ email: string }> {
    const token_hash = hashToken(token);
    const dealership_invitation =
      await this.dealership_invitation_repository.findOneByTokenHash(token_hash);

    if (!dealership_invitation) {
      throw new InvitationNotFoundException(token_hash);
    }
    if (dealership_invitation.is_expired()) {
      throw new InvitationExpiredException();
    }
    if (dealership_invitation.is_accepted()) {
      throw new InvitationAlreadyAcceptedException();
    }
    if (dealership_invitation.is_revoked()) {
      throw new InvitationRevokedException();
    }

    const email = dealership_invitation.toPrimitives().email;
    const revoked_invitation = dealership_invitation.update({
      status: "revoked",
    });
    await this.dealership_invitation_repository.update(revoked_invitation);
    return { email };
  }

  async revoke(id: string): Promise<void> {
    const invitation = await this.dealership_invitation_repository.findOne(id);
    if (!invitation) {
      throw new InvitationNotFoundException(id);
    }

    const primitives = invitation.toPrimitives();
    if (primitives.status !== "pending") {
      throw new InvitationNotPendingException(id);
    }

    const revoked = invitation.update({ status: "revoked" });
    await this.dealership_invitation_repository.update(revoked);
  }

  private toDealershipMemberRole(
    role: string,
  ): PrimitiveDealershipMember["role"] {
    if (
      dealership_member_roles.has(role as PrimitiveDealershipMember["role"])
    ) {
      return role as PrimitiveDealershipMember["role"];
    }
    throw new BadRequestException(
      `La invitación tiene un rol inválido: ${role}`,
    );
  }
}
