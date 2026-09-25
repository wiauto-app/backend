import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { NotificationChannelDispatcher } from "@/src/contexts/alerts/services/notification-channel-dispatcher.service";
import { PUSH_TYPE } from "@/src/contexts/alerts/types/push-message";
import { EntitlementsService } from "@/src/contexts/billing/services/entitlements.service";
import { ENTITLEMENT_FEATURE } from "@/src/contexts/billing/types/entitlement-features";
import { getBooleanFromEntitlement } from "@/src/contexts/billing/types/entitlement-resolve";

import {
  PROACTIVE_ALERT_TYPES,
  proactiveAlertCategory,
  type ProactiveAlertType,
} from "../constants/proactive-alert-types";
import { ProactiveAlertLogEntity } from "../entities/proactive-alert-log.entity";
import { ProactiveAlertSettingsEntity } from "../entities/proactive-alert-settings.entity";
import type { ProactiveAlertPayload } from "../utils/proactive-alert-rules";

@Injectable()
export class ProactiveAlertDispatchService {
  constructor(
    @InjectRepository(ProactiveAlertSettingsEntity)
    private readonly settings_repository: Repository<ProactiveAlertSettingsEntity>,
    @InjectRepository(ProactiveAlertLogEntity)
    private readonly log_repository: Repository<ProactiveAlertLogEntity>,
    private readonly entitlements_service: EntitlementsService,
    private readonly notification_dispatcher: NotificationChannelDispatcher,
  ) {}

  async tryDispatch(params: {
    profile_id: string;
    type: ProactiveAlertType;
    dedupe_key: string;
    vehicle_id?: string | null;
    payload: ProactiveAlertPayload;
  }): Promise<boolean> {
    const resolved = await this.entitlements_service.resolve(params.profile_id);
    const enabled = getBooleanFromEntitlement(
      resolved.features[ENTITLEMENT_FEATURE.PROACTIVE_ALERTS],
    );
    if (!resolved.is_unlimited && !enabled) {
      return false;
    }

    const settings = await this.resolveSettings(params.profile_id);
    if (!settings.enabled_types.includes(params.type)) {
      return false;
    }

    const catalog = PROACTIVE_ALERT_TYPES.find((item) => item.type === params.type);
    if (catalog?.cooldown_days != null) {
      const since = new Date();
      since.setDate(since.getDate() - catalog.cooldown_days);
      const recent = await this.log_repository
        .createQueryBuilder("log")
        .where("log.profile_id = :profile_id", { profile_id: params.profile_id })
        .andWhere("log.type = :type", { type: params.type })
        .andWhere("log.sent_at >= :since", { since })
        .andWhere(
          params.vehicle_id
            ? "log.vehicle_id = :vehicle_id"
            : "1=1",
          params.vehicle_id ? { vehicle_id: params.vehicle_id } : {},
        )
        .getCount();
      if (recent > 0) {
        return false;
      }
    }

    const existing = await this.log_repository.findOne({
      where: { dedupe_key: params.dedupe_key },
    });
    if (existing) {
      return false;
    }

    await this.notification_dispatcher.notify({
      profile_id: params.profile_id,
      category: proactiveAlertCategory(params.type),
      title: params.payload.title,
      body: params.payload.body,
      push_type: PUSH_TYPE.SELLER_INSIGHT,
      data: {
        ...params.payload.data,
        vehicle_id: params.vehicle_id ?? params.payload.data.vehicle_id,
        proactive_type: params.type,
      },
    });

    await this.log_repository.save(
      this.log_repository.create({
        profile_id: params.profile_id,
        vehicle_id: params.vehicle_id ?? null,
        type: params.type,
        dedupe_key: params.dedupe_key,
      }),
    );

    return true;
  }

  private async resolveSettings(
    profile_id: string,
  ): Promise<ProactiveAlertSettingsEntity> {
    const row = await this.settings_repository.findOne({
      where: { profile_id },
    });
    if (row) {
      return row;
    }
    return {
      profile_id,
      enabled_types: ProactiveAlertSettingsEntity.defaultEnabledTypes(),
    } as ProactiveAlertSettingsEntity;
  }
}
