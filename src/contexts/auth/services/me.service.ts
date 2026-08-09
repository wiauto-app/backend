import { Injectable } from "@nestjs/common";

import { TypeOrmDealershipMemberRepository } from "@/src/contexts/dealership/repositories/typeorm.dealership-member-repository";
import { UserAuthProviderService } from "@/src/contexts/users/services/user-auth-provider.service";
import { UserService } from "@/src/contexts/users/services/user.service";

import { MeResponseDto } from "../dto/me-response.dto";
import { User } from "../../users/entities/user.entity";
import { AuthService } from "./auth.service";

@Injectable()
export class MeService {
  constructor(
    private readonly dealership_member_repository: TypeOrmDealershipMemberRepository,
    private readonly user_auth_provider_service: UserAuthProviderService,
    private readonly user_service: UserService,
    private readonly auth_service: AuthService,
  ) {}

  async getMe(user: User, scope?: "session" | "2fa_challenge"): Promise<MeResponseDto> {
    // const cached = await this.cacheManager.get<MeResponseDto>(`me:${user.id}`);
    // if (cached) {
    //   return cached;
    // }
    const [membership_detail, identity] = await Promise.all([
      user.profile.id
        ? this.dealership_member_repository.findMembershipDetailByProfileId(user.profile.id)
        : Promise.resolve(null),
      this.user_auth_provider_service.getAuthIdentitySummary(user.id),
    ]);
    const me =  MeResponseDto.fromUser(user, {
      providers: identity.providers,
      has_password: identity.has_password,
      scope,
      dealership_membership: membership_detail,
    });

    //1 minute
    // await this.cacheManager.set(`me:${user.id}`, me, 60);
    return me;
  }

  async deleteAccount(user_id: string, session_id: string): Promise<{ message: string; data: null }> {
    await this.user_service.remove(user_id);
    try {
      await this.auth_service.logout(session_id);
    } catch {
      // La cuenta ya se eliminó; limpiar sesión es best-effort.
    }
    return {
      message: "Cuenta eliminada correctamente",
      data: null,
    };
  }
}
