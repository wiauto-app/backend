import {
  Injectable,
  Logger,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { TypeOrmDealershipMemberRepository } from "@/src/contexts/dealership/repositories/typeorm.dealership-member-repository";
import { UserAuthProviderService } from "@/src/contexts/users/services/user-auth-provider.service";
import { UserService } from "@/src/contexts/users/services/user.service";
import { VehicleEntity } from "@/src/contexts/vehicles/entities/vehicle.entity";
import { VehicleSearchIndexer } from "@/src/contexts/vehicles/search/indexing/vehicle-search-indexer.service";
import { BillingSubscriptionProvisioningService } from "@/src/contexts/billing/services/billing-subscription-provisioning.service";

import { MeResponseDto } from "../dto/me-response.dto";
import { User } from "../../users/entities/user.entity";
import { AppleTokenService } from "./apple-token.service";
import { AuthService } from "./auth.service";
import { EntitlementsService } from "../../billing/services/entitlements.service";
import { MeSessionCacheService } from "./me-session-cache.service";

@Injectable()
export class MeService {
  private readonly logger = new Logger(MeService.name);

  constructor(
    private readonly dealershipMemberRepository: TypeOrmDealershipMemberRepository,
    private readonly userAuthProviderService: UserAuthProviderService,
    private readonly entitlementsService: EntitlementsService,
    private readonly userService: UserService,
    private readonly authService: AuthService,
    private readonly appleTokenService: AppleTokenService,
    private readonly meSessionCacheService: MeSessionCacheService,
    private readonly billingSubscriptionProvisioningService: BillingSubscriptionProvisioningService,
    private readonly vehicleSearchIndexer: VehicleSearchIndexer,
    @InjectRepository(VehicleEntity)
    private readonly vehicleRepository: Repository<VehicleEntity>,
  ) {}

  async getMe(user: User, scope?: "session" | "2fa_challenge"): Promise<MeResponseDto> {
    const cached = await this.meSessionCacheService.get(user.id);
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
    const me = MeResponseDto.fromUser(user, {
      providers: identity.providers,
      has_password: identity.has_password,
      scope,
      dealership_membership: membership_detail,
      billing_summary: billingSummary,
    });

    await this.meSessionCacheService.set(user.id, me);
    return me;
  }

  async invalidateMeCache(user_id: string): Promise<void> {
    await this.meSessionCacheService.invalidate(user_id);
  }

  async deleteAccount(user_id: string, _session_id: string): Promise<{ message: string; data: null }> {
    const user = await this.userService.findOne(user_id);

    await this.revokeAppleSignIn(user_id);
    await this.billingSubscriptionProvisioningService.cancelActiveSubscriptionsForProfile(
      user.id,
    );
    await this.deindexAndSoftDeleteVehiclesForProfile(user.id);
    await this.meSessionCacheService.invalidate(user_id);

    try {
      await this.authService.logoutAllForUser(user_id);
    } catch {
      // Cerrar sesiones es best-effort antes de borrar la cuenta.
    }

    await this.userService.remove(user_id);

    return {
      message: "Cuenta eliminada correctamente",
      data: null,
    };
  }

  private async revokeAppleSignIn(user_id: string): Promise<void> {
    try {
      const appleIdentity =
        await this.userAuthProviderService.findByUserAndProvider(user_id, "apple");
      await this.appleTokenService.revokeStoredRefreshToken(appleIdentity);
    } catch (error) {
      this.logger.warn(
        `No se pudo revocar Sign in with Apple para el usuario ${user_id}`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  private async deindexAndSoftDeleteVehiclesForProfile(profile_id: string): Promise<void> {
    const vehicles = await this.vehicleRepository.find({
      where: { profile_id },
      select: ["id"],
      withDeleted: true,
    });

    const vehicle_ids = vehicles.map((vehicle) => vehicle.id);
    await this.vehicleSearchIndexer.deleteVehicles(vehicle_ids);

    // Soft-delete para que userService.remove no bloquee por anuncios asociados.
    await this.vehicleRepository
      .createQueryBuilder()
      .softDelete()
      .where("profile_id = :profile_id", { profile_id })
      .andWhere("deleted_at IS NULL")
      .execute();
  }
}
