import { Injectable } from "@nestjs/common";

import { TypeOrmDealershipMemberRepository } from "@/src/contexts/dealership/repositories/typeorm.dealership-member-repository";
import { UserAuthProviderService } from "@/src/contexts/users/services/user-auth-provider.service";
import { UserService } from "@/src/contexts/users/services/user.service";

import { MeResponseDto } from "../dto/me-response.dto";
import { User } from "../../users/entities/user.entity";
import { AuthService } from "./auth.service";
import { Cache } from "@nestjs/cache-manager";
import { EntitlementsService } from "../../billing/services/entitlements.service";

@Injectable()
export class MeService {
  constructor(
    private readonly dealershipMemberRepository: TypeOrmDealershipMemberRepository,
    private readonly userAuthProviderService: UserAuthProviderService,
    private readonly entitlementsService: EntitlementsService,
    private readonly userService: UserService,
    private readonly authService: AuthService,
    private readonly cacheManager: Cache,
  ) {}

  async getMe(user: User, scope?: "session" | "2fa_challenge"): Promise<MeResponseDto> {
    const cached = await this.cacheManager.get<MeResponseDto>(`me:${user.id}`);
    if (cached) {
      return cached;
    }
    const [membership_detail, identity, billingSummary] = await Promise.all([
      user.profile.id
        ? this.dealershipMemberRepository.findMembershipDetailByProfileId(user.profile.id)
        : Promise.resolve(null),
      this.userAuthProviderService.getAuthIdentitySummary(user.id),
      this.entitlementsService.getBillingMe(user.id),
    ]);
    const me =  MeResponseDto.fromUser(user, {
      providers: identity.providers,
      has_password: identity.has_password,
      scope,
      dealership_membership: membership_detail,
      billing_summary: billingSummary,
    });

    //5 minute
    await this.cacheManager.set(`me:${user.id}`, me, 300);
    return me;
  }

  async deleteAccount(user_id: string, session_id: string): Promise<{ message: string; data: null }> {
    await this.userService.remove(user_id);
    try {
      await this.authService.logout(session_id);
    } catch {
      // La cuenta ya se eliminó; limpiar sesión es best-effort.
    }
    return {
      message: "Cuenta eliminada correctamente",
      data: null,
    };
  }
}
