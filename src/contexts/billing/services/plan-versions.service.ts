import {
  BadRequestException,
  ConflictException,
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
  FREE_ENTITLEMENTS,
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

  async ensureDraftVersion(plan_id: string): Promise<PlanVersionEntity> {
    const plan = await this.plan_repository.findOne({ where: { id: plan_id } });
    if (!plan) {
      throw new NotFoundException("Plan no encontrado");
    }

    const draft = await this.plan_version_repository.findOne({
      where: { plan_id, status: PLAN_VERSION_STATUS.DRAFT },
      relations: { entitlements: true },
      order: { version: "DESC" },
    });
    if (draft) {
      return draft;
    }

    const latest = await this.plan_version_repository.findOne({
      where: { plan_id },
      order: { version: "DESC" },
      relations: { entitlements: true },
    });

    const next_version = (latest?.version ?? 0) + 1;
    const created = await this.plan_version_repository.save({
      plan_id,
      version: next_version,
      status: PLAN_VERSION_STATUS.DRAFT,
      published_at: null,
    });

    const source_entitlements =
      latest?.entitlements?.length
        ? latest.entitlements
        : FREE_ENTITLEMENTS.map((item) => ({
            feature: item.feature,
            value_type: item.value_type,
            value: item.value,
          }));

    for (const entitlement of source_entitlements) {
      await this.plan_entitlement_repository.save({
        plan_version_id: created.id,
        feature: entitlement.feature,
        value_type: entitlement.value_type,
        value: entitlement.value,
      });
    }

    return (await this.plan_version_repository.findOne({
      where: { id: created.id },
      relations: { entitlements: true },
    })) as PlanVersionEntity;
  }

  async findPublishedByPlanId(plan_id: string): Promise<PlanVersionEntity | null> {
    return this.plan_version_repository.findOne({
      where: { plan_id, status: PLAN_VERSION_STATUS.PUBLISHED },
      relations: { entitlements: true },
    });
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
    return this.plan_version_repository.find({
      where: { plan_id },
      relations: { entitlements: true },
      order: { version: "DESC" },
    });
  }

  async replaceDraftEntitlements(
    plan_id: string,
    entitlements: UpsertEntitlementInput[],
  ) {
    this.validateEntitlements(entitlements);
    const draft = await this.ensureDraftVersion(plan_id);

    await this.plan_entitlement_repository.delete({
      plan_version_id: draft.id,
    });

    for (const entitlement of entitlements) {
      await this.plan_entitlement_repository.save({
        plan_version_id: draft.id,
        feature: entitlement.feature,
        value_type: entitlement.value_type,
        value: entitlement.value,
      });
    }

    return this.findById(draft.id);
  }

  async publish(plan_id: string, version_id?: string) {
    const draft = version_id
      ? await this.findById(version_id)
      : await this.plan_version_repository.findOne({
          where: { plan_id, status: PLAN_VERSION_STATUS.DRAFT },
          relations: { entitlements: true },
          order: { version: "DESC" },
        });

    if (!draft || draft.plan_id !== plan_id) {
      throw new NotFoundException("No hay versión draft para publicar");
    }
    if (draft.status !== PLAN_VERSION_STATUS.DRAFT) {
      throw new ConflictException("Solo se pueden publicar versiones en draft");
    }
    if (!draft.entitlements?.length) {
      throw new BadRequestException(
        "La versión debe tener entitlements antes de publicarse",
      );
    }

    const current_published = await this.findPublishedByPlanId(plan_id);
    if (current_published) {
      const archived = await this.plan_version_repository.preload({
        id: current_published.id,
        status: PLAN_VERSION_STATUS.ARCHIVED,
      });
      if (archived) {
        await this.plan_version_repository.save(archived);
      }
    }

    const published = await this.plan_version_repository.preload({
      id: draft.id,
      status: PLAN_VERSION_STATUS.PUBLISHED,
      published_at: new Date(),
    });
    if (!published) {
      throw new NotFoundException("Versión no encontrada");
    }

    return this.plan_version_repository.save(published);
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
