import {
  BadRequestException,
  Injectable,
  Logger,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Cache } from "@nestjs/cache-manager";
import { Repository } from "typeorm";

import { TypeOrmDealershipMemberRepository } from "@/src/contexts/dealership/repositories/typeorm.dealership-member-repository";
import { UserAuthProviderService } from "@/src/contexts/users/services/user-auth-provider.service";
import { UserService } from "@/src/contexts/users/services/user.service";
import { VehicleEntity } from "@/src/contexts/vehicles/entities/vehicle.entity";
import { VehicleSearchIndexer } from "@/src/contexts/vehicles/search/indexing/vehicle-search-indexer.service";
import { StripeClient } from "@/src/contexts/billing/clients/stripe.client";
import { TypeOrmSubscriptionRepository } from "@/src/contexts/billing/repositories/typeorm.subscription-repository";

import { MeResponseDto } from "../dto/me-response.dto";
import { User } from "../../users/entities/user.entity";
import { AuthService } from "./auth.service";
import { EntitlementsService } from "../../billing/services/entitlements.service";

@Injectable()
export class MeService {
  private readonly logger = new Logger(MeService.name);

  constructor(
    private readonly dealershipMemberRepository: TypeOrmDealershipMemberRepository,
    private readonly userAuthProviderService: UserAuthProviderService,
    private readonly entitlementsService: EntitlementsService,
    private readonly userService: UserService,
    private readonly authService: AuthService,
    private readonly cacheManager: Cache,
    private readonly subscriptionRepository: TypeOrmSubscriptionRepository,
    private readonly stripeClient: StripeClient,
    private readonly vehicleSearchIndexer: VehicleSearchIndexer,
    @InjectRepository(VehicleEntity)
    private readonly vehicleRepository: Repository<VehicleEntity>,
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
    const me = MeResponseDto.fromUser(user, {
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
    const user = await this.userService.findOne(user_id);

    await this.cancelActiveSubscriptionsForProfile(user.id);
    await this.deindexAndSoftDeleteVehiclesForProfile(user.id);
    await this.cacheManager.del(`me:${user_id}`);

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

  private async cancelActiveSubscriptionsForProfile(profile_id: string): Promise<void> {
    const subscriptions =
      await this.subscriptionRepository.findCancellableByProfileId(profile_id);

    for (const subscription of subscriptions) {
      try {
        await this.stripeClient.cancelSubscriptionImmediately(
          subscription.stripe_subscription_id,
        );
      } catch (error) {
        const stripe_error = error as { code?: string; statusCode?: number };
        const already_gone =
          stripe_error.code === "resource_missing" ||
          stripe_error.statusCode === 404;

        if (!already_gone) {
          this.logger.error(
            `No se pudo cancelar la suscripción Stripe ${subscription.stripe_subscription_id}`,
            error instanceof Error ? error.stack : String(error),
          );
          throw new BadRequestException(
            "No se pudo cancelar tu suscripción. Inténtalo de nuevo o contacta con soporte antes de eliminar la cuenta.",
          );
        }
      }

      await this.subscriptionRepository.markCanceled(subscription.id);
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
