import { Injectable } from "@nestjs/common";

import { TypeOrmDealershipMemberRepository } from "@/src/contexts/dealership/repositories/typeorm.dealership-member-repository";
import { UserAuthProviderService } from "@/src/contexts/users/services/user-auth-provider.service";

import { MeResponseDto } from "../dto/me-response.dto";
import { User } from "../../users/entities/user.entity";

@Injectable()
export class MeService {
  constructor(
    private readonly dealership_member_repository: TypeOrmDealershipMemberRepository,
    private readonly user_auth_provider_service: UserAuthProviderService,
  ) {}

  async getMe(user: User, scope?: "session" | "2fa_challenge"): Promise<MeResponseDto> {
    const [membership_detail, identity] = await Promise.all([
      user.profile.id
        ? this.dealership_member_repository.findMembershipDetailByProfileId(user.profile.id)
        : Promise.resolve(null),
      this.user_auth_provider_service.getAuthIdentitySummary(user.id),
    ]);
    return MeResponseDto.fromUser(user, {
      providers: identity.providers,
      has_password: identity.has_password,
      scope,
      dealership_membership: membership_detail,
    });
  }
}
