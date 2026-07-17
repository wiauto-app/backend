import { Injectable } from "@nestjs/common";

import { TypeOrmDealershipMemberRepository } from "@/src/contexts/dealership/repositories/typeorm.dealership-member-repository";

import { MeDealershipMembershipDto, MeResponseDto } from "../dto/me-response.dto";
import { User } from "../../users/entities/user.entity";

@Injectable()
export class MeService {
  constructor(
    private readonly dealership_member_repository: TypeOrmDealershipMemberRepository,
  ) {}

  async getMe(user: User, scope?: "session" | "2fa_challenge"): Promise<MeResponseDto> {
    const membership_detail = user.profile?.id
      ? await this.dealership_member_repository.findMembershipDetailByProfileId(user.profile.id)
      : null;

    return MeResponseDto.fromUser(user, scope, membership_detail);
  }
}
