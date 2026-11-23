import {
  BadRequestException,
  ConflictException,
  Inject,
  Logger,
  NotFoundException,
  forwardRef,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, In, IsNull, LessThanOrEqual, MoreThan, Repository } from "typeorm";

import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { ProfileEntity } from "@/src/contexts/profiles/entities/profile.entity";
import { DealershipService } from "@/src/contexts/dealership/services/dealership.service";
import { AdminDealershipMinimalInput } from "@/src/contexts/dealership/dto/admin-dealership-minimal.dto";
import { PlanAccessGrantEntity } from "../entities/plan-access-grant.entity";
import { SubscriptionEntity } from "../entities/subscription.entity";
import { SubscriptionPlanEntity } from "../entities/subscription-plan.entity";
import { PLAN_AUDIENCE, SUBSCRIPTION_STATUS } from "../types/billing.enums";
import { PlanVersionsService } from "./plan-versions.service";
import { VehiclePublisherSyncService } from "@/src/contexts/vehicles/services/vehicle-publisher-sync.service";

export interface AssignPlanAccessGrantInput {
  profile_id: string;
  plan_id: string;
  granted_by_user_id: string;
  expires_at?: string | null;
  reason?: string | null;
  /** Datos mínimos para crear el concesionario si el plan es de concesionario y el perfil no tiene uno. */
  dealership?: AdminDealershipMinimalInput | null;
}

/** Suscripciones de pago que siguen dando derecho al plan del concesionario. */
const PAID_SUBSCRIPTION_STATUSES = [
  SUBSCRIPTION_STATUS.ACTIVE,
  SUBSCRIPTION_STATUS.TRIALING,
  SUBSCRIPTION_STATUS.PAST_DUE,
];

const EXPIRED_GRANTS_BATCH_SIZE = 100;

@Injectable()
export class PlanAccessGrantsService {
  private readonly logger = new Logger(PlanAccessGrantsService.name);

  constructor(
    private readonly data_source: DataSource,
    private readonly plan_versions_service: PlanVersionsService,
    @Inject(forwardRef(() => DealershipService))
    private readonly dealershipService: DealershipService,
    @InjectRepository(ProfileEntity)
    private readonly profile_repository: Repository<ProfileEntity>,
    @InjectRepository(PlanAccessGrantEntity)
    private readonly grant_repository: Repository<PlanAccessGrantEntity>,
    @InjectRepository(SubscriptionPlanEntity)
    private readonly plan_repository: Repository<SubscriptionPlanEntity>,
    @InjectRepository(SubscriptionEntity)
    private readonly subscription_repository: Repository<SubscriptionEntity>,
    private readonly vehicle_publisher_sync_service: VehiclePublisherSyncService,
  ) {}

  async findActiveByProfileId(
    profile_id: string,
  ): Promise<PlanAccessGrantEntity | null> {
    const now = new Date();
    return this.grant_repository.findOne({
      where: [
        { profile_id, revoked_at: IsNull(), expires_at: IsNull() },
        { profile_id, revoked_at: IsNull(), expires_at: MoreThan(now) },
      ],
      relations: { plan: true, plan_version: true },
      order: { created_at: "DESC" },
    });
  }

  async getActiveForAdmin(profile_id: string) {
    await this.ensureProfile(profile_id);
    const grant = await this.findActiveByProfileId(profile_id);
    return grant ? this.serialize(grant) : null;
  }

  async assign(input: AssignPlanAccessGrantInput) {
    await this.ensureProfile(input.profile_id);
    const plan = await this.plan_repository.findOne({
      where: { id: input.plan_id },
    });
    if (!plan) {
      throw new NotFoundException("Plan no encontrado");
    }
    const published = await this.plan_versions_service.findPublishedByPlanId(
      input.plan_id,
    );
    if (!published) {
      throw new BadRequestException(
        "El plan no tiene una versión publicada de entitlements",
      );
    }

    const expires_at = input.expires_at ? new Date(input.expires_at) : null;
    if (expires_at && expires_at.getTime() <= Date.now()) {
      throw new BadRequestException("La fecha de vencimiento debe ser futura");
    }
    const reason = input.reason?.trim();
    const is_dealership_plan = plan.audience === PLAN_AUDIENCE.DEALERSHIP;

    if (is_dealership_plan) {
      await this.assertCanLinkDealershipPlan(input.profile_id);
      // Primero el concesionario: si falla no queda un grant huérfano y un
      // reintento reutiliza el concesionario ya creado (idempotente).
      await this.dealershipService.ensureForProfile(
        input.profile_id,
        input.dealership ?? undefined,
      );
    }

    const previous_grant = await this.findActiveByProfileId(input.profile_id);

    const grant_id = await this.data_source.transaction(async (manager) => {
      const repository = manager.getRepository(PlanAccessGrantEntity);
      await repository.update(
        { profile_id: input.profile_id, revoked_at: IsNull() },
        {
          revoked_at: new Date(),
          revoked_by_user_id: input.granted_by_user_id,
        },
      );

      const created = await repository.save({
        profile_id: input.profile_id,
        plan_id: input.plan_id,
        plan_version_id: published.id,
        granted_by_user_id: input.granted_by_user_id,
        revoked_by_user_id: null,
        reason: reason === "" ? null : (reason ?? null),
        expires_at,
        revoked_at: null,
      });
      return created.id;
    });

    const grant = await this.grant_repository.findOneOrFail({
      where: { id: grant_id },
      relations: { plan: true, plan_version: true },
    });

    if (is_dealership_plan) {
      await this.dealershipService.linkBillingPlanForProfile(
        input.profile_id,
        input.plan_id,
      );
      await this.vehicle_publisher_sync_service.syncForProfile(input.profile_id);
    } else if (previous_grant && previous_grant.plan_id !== input.plan_id) {
      await this.releaseDealershipPlanIfGranted(
        input.profile_id,
        previous_grant.plan_id,
      );
    }

    return this.serialize(grant);
  }

  async revoke(profile_id: string, revoked_by_user_id: string): Promise<void> {
    await this.ensureProfile(profile_id);
    const active_grant = await this.findActiveByProfileId(profile_id);
    await this.grant_repository.update(
      { profile_id, revoked_at: IsNull() },
      { revoked_at: new Date(), revoked_by_user_id },
    );
    if (active_grant) {
      await this.releaseDealershipPlanIfGranted(profile_id, active_grant.plan_id);
    }
  }

  /**
   * Procesa grants vencidos aún no procesados: libera el plan del concesionario
   * y marca `expired_processed_at`. Idempotente; devuelve cuántos procesó.
   */
  async processExpiredGrants(now: Date = new Date()): Promise<number> {
    let processed = 0;
    for (;;) {
      const expired = await this.grant_repository.find({
        where: {
          revoked_at: IsNull(),
          expired_processed_at: IsNull(),
          expires_at: LessThanOrEqual(now),
        },
        order: { expires_at: "ASC" },
        take: EXPIRED_GRANTS_BATCH_SIZE,
      });
      if (expired.length === 0) {
        return processed;
      }

      for (const grant of expired) {
        try {
          const still_active = await this.findActiveByProfileId(grant.profile_id);
          if (!still_active || still_active.plan_id !== grant.plan_id) {
            await this.releaseDealershipPlanIfGranted(
              grant.profile_id,
              grant.plan_id,
            );
          }
        } catch (error) {
          this.logger.error(
            `No se pudo liberar el plan del grant vencido ${grant.id}`,
            error instanceof Error ? error.stack : String(error),
          );
        }
        await this.grant_repository.update(grant.id, {
          expired_processed_at: now,
        });
        processed += 1;
      }

      if (expired.length < EXPIRED_GRANTS_BATCH_SIZE) {
        return processed;
      }
    }
  }

  /**
   * Quita `billing_plan_id` del concesionario si lo puso este grant y el perfil
   * no tiene una suscripción de pago vigente; después resincroniza el publicador.
   */
  private async releaseDealershipPlanIfGranted(
    profile_id: string,
    plan_id: string,
  ): Promise<void> {
    const has_paid_subscription = await this.subscription_repository.exists({
      where: { profile_id, status: In(PAID_SUBSCRIPTION_STATUSES) },
    });
    if (has_paid_subscription) {
      return;
    }
    await this.dealershipService.unlinkBillingPlanForProfile(profile_id, plan_id);
    await this.vehicle_publisher_sync_service.syncForProfile(profile_id);
  }

  private async assertCanLinkDealershipPlan(profile_id: string): Promise<void> {
    const membership =
      await this.dealershipService.findMembershipSummaryByProfileId(profile_id);
    if (membership && membership.role !== "owner") {
      throw new ConflictException(
        `El usuario es miembro de ${membership.dealership_name || "un concesionario"}, no propietario. Asigna el plan al propietario.`,
      );
    }
  }

  private async ensureProfile(profile_id: string): Promise<void> {
    const exists = await this.profile_repository.exists({
      where: { id: profile_id },
    });
    if (!exists) {
      throw new NotFoundException("Perfil no encontrado");
    }
  }

  private serialize(grant: PlanAccessGrantEntity) {
    return {
      id: grant.id,
      profile_id: grant.profile_id,
      plan_id: grant.plan_id,
      plan_name: grant.plan.name,
      plan_version_id: grant.plan_version_id,
      plan_version: grant.plan_version.version,
      reason: grant.reason,
      expires_at: grant.expires_at,
      created_at: grant.created_at,
    };
  }
}
