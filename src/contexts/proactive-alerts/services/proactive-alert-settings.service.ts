import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { PROACTIVE_ALERT_TYPES } from "../constants/proactive-alert-types";
import { ProactiveAlertSettingsEntity } from "../entities/proactive-alert-settings.entity";
import type { ProactiveAlertType } from "../constants/proactive-alert-types";

export interface ProactiveAlertSettingsResponse {
  catalog: typeof PROACTIVE_ALERT_TYPES;
  enabled_types: ProactiveAlertType[];
}

@Injectable()
export class ProactiveAlertSettingsService {
  constructor(
    @InjectRepository(ProactiveAlertSettingsEntity)
    private readonly settings_repository: Repository<ProactiveAlertSettingsEntity>,
  ) {}

  async getForProfile(profile_id: string): Promise<ProactiveAlertSettingsResponse> {
    const row = await this.settings_repository.findOne({ where: { profile_id } });
    return {
      catalog: PROACTIVE_ALERT_TYPES,
      enabled_types:
        row?.enabled_types ?? ProactiveAlertSettingsEntity.defaultEnabledTypes(),
    };
  }

  async patch(
    profile_id: string,
    enabled_types: ProactiveAlertType[],
  ): Promise<ProactiveAlertSettingsResponse> {
    const allowed = new Set(
      PROACTIVE_ALERT_TYPES.map((item) => item.type),
    );
    const sanitized = enabled_types.filter((type) => allowed.has(type));

    const existing = await this.settings_repository.findOne({
      where: { profile_id },
    });
    const row = await this.settings_repository.preload({
      profile_id,
      enabled_types: sanitized,
      ...(existing ? {} : {}),
    });
    if (!row) {
      await this.settings_repository.save({
        profile_id,
        enabled_types: sanitized,
      });
    } else {
      await this.settings_repository.save(row);
    }

    return this.getForProfile(profile_id);
  }
}
