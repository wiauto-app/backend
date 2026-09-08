import {
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { PlanEntitlementEntity } from "../entities/plan-entitlement.entity";
import { PlanVersionEntity } from "../entities/plan-version.entity";
import { SubscriptionPlanEntity } from "../entities/subscription-plan.entity";
import { PLAN_VERSION_STATUS } from "../types/billing.enums";
import {
  ENTITLEMENT_VALUE_TYPE,
  EntitlementValue,
  EntitlementValueType,
  FEATURE_CATALOG,
  isEntitlementFeature,
} from "../types/entitlement-features";

export interface UpsertEntitlementInput {
  feature: string;
  value_type: EntitlementValueType;
  value: EntitlementValue;
}

@Injectable()
export class PlanVersionsService {
  constructor(
    @InjectRepository(PlanVersionEntity)
    private readonly plan_version_repository: Repository<PlanVersionEntity>,
    @InjectRepository(PlanEntitlementEntity)
    private readonly plan_entitlement_repository: Repository<PlanEntitlementEntity>,
    @InjectRepository(SubscriptionPlanEntity)
    private readonly plan_repository: Repository<SubscriptionPlanEntity>,
  ) {}

  async assertPlanExists(plan_id: string): Promise<SubscriptionPlanEntity> {
    const plan = await this.plan_repository.findOne({ where: { id: plan_id } });
    if (!plan) {
      throw new NotFoundException("Plan no encontrado");
    }
    return plan;
  }

  /**
   * Versión vigente del plan: published de mayor `version`.
   */
  async getCurrentVersion(plan_id: string): Promise<PlanVersionEntity | null> {
    return this.plan_version_repository.findOne({
      where: { plan_id, status: PLAN_VERSION_STATUS.PUBLISHED },
      relations: { entitlements: true },
      order: { version: "DESC" },
    });
  }

  async findPublishedByPlanId(plan_id: string): Promise<PlanVersionEntity | null> {
    return this.getCurrentVersion(plan_id);
  }

  async findById(id: string): Promise<PlanVersionEntity> {
    const version = await this.plan_version_repository.findOne({
      where: { id },
      relations: { entitlements: true, plan: true },
    });
    if (!version) {
      throw new NotFoundException("Versión de plan no encontrada");
    }
    return version;
  }

  async listByPlanId(plan_id: string) {
    await this.assertPlanExists(plan_id);
    return this.plan_version_repository.find({
      where: { plan_id },
      relations: { entitlements: true },
      order: { version: "DESC" },
    });
  }

  /**
   * Reemplaza entitlements in-place sobre la versión published vigente.
   * Si no existe, crea published v1.
   */
  async replaceEntitlements(
    plan_id: string,
    entitlements: UpsertEntitlementInput[],
  ): Promise<PlanVersionEntity> {
    this.validateEntitlements(entitlements);
    await this.assertPlanExists(plan_id);

    let current = await this.getCurrentVersion(plan_id);
    if (!current) {
      const latest = await this.plan_version_repository.findOne({
        where: { plan_id },
        order: { version: "DESC" },
      });
      current = await this.plan_version_repository.save({
        plan_id,
        version: (latest?.version ?? 0) + 1,
        status: PLAN_VERSION_STATUS.PUBLISHED,
        published_at: new Date(),
      });
    }

    await this.plan_entitlement_repository.delete({
      plan_version_id: current.id,
    });

    for (const entitlement of entitlements) {
      await this.plan_entitlement_repository.save({
        plan_version_id: current.id,
        feature: entitlement.feature,
        value_type: entitlement.value_type,
        value: entitlement.value,
      });
    }

    return this.findById(current.id);
  }

  getFeatureCatalog() {
    return FEATURE_CATALOG;
  }

  private validateEntitlements(entitlements: UpsertEntitlementInput[]) {
    const seen = new Set<string>();
    for (const item of entitlements) {
      if (!isEntitlementFeature(item.feature)) {
        throw new BadRequestException(`Feature no válida: ${item.feature}`);
      }
      if (seen.has(item.feature)) {
        throw new BadRequestException(`Feature duplicada: ${item.feature}`);
      }
      seen.add(item.feature);

      if (item.value_type === ENTITLEMENT_VALUE_TYPE.BOOLEAN) {
        if (typeof (item.value as { bool?: unknown }).bool !== "boolean") {
          throw new BadRequestException(
            `Value inválido para ${item.feature}: se espera { bool }`,
          );
        }
      }
      if (item.value_type === ENTITLEMENT_VALUE_TYPE.LIMIT) {
        if (typeof (item.value as { limit?: unknown }).limit !== "number") {
          throw new BadRequestException(
            `Value inválido para ${item.feature}: se espera { limit }`,
          );
        }
      }
      if (item.value_type === ENTITLEMENT_VALUE_TYPE.UNLIMITED) {
        if ((item.value as { unlimited?: unknown }).unlimited !== true) {
          throw new BadRequestException(
            `Value inválido para ${item.feature}: se espera { unlimited: true }`,
          );
        }
      }
    }
  }
}
