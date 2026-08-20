import {
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, IsNull, MoreThan, Repository } from "typeorm";

import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { ProfileEntity } from "@/src/contexts/profiles/entities/profile.entity";
import { PlanAccessGrantEntity } from "../entities/plan-access-grant.entity";
import { PlanVersionsService } from "./plan-versions.service";

export interface AssignPlanAccessGrantInput {
  profile_id: string;
  plan_id: string;
  granted_by_user_id: string;
  expires_at?: string | null;
  reason?: string | null;
}

@Injectable()
export class PlanAccessGrantsService {
  constructor(
    private readonly data_source: DataSource,
    private readonly plan_versions_service: PlanVersionsService,
    @InjectRepository(ProfileEntity)
    private readonly profile_repository: Repository<ProfileEntity>,
    @InjectRepository(PlanAccessGrantEntity)
    private readonly grant_repository: Repository<PlanAccessGrantEntity>,
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
    return this.serialize(grant);
  }

  async revoke(profile_id: string, revoked_by_user_id: string): Promise<void> {
    await this.ensureProfile(profile_id);
    await this.grant_repository.update(
      { profile_id, revoked_at: IsNull() },
      { revoked_at: new Date(), revoked_by_user_id },
    );
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
