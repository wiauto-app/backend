import { BadRequestException } from "@nestjs/common";
import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { EntitlementsService } from "@/src/contexts/billing/services/entitlements.service";
import { ENTITLEMENT_FEATURE } from "@/src/contexts/billing/types/entitlement-features";
import {
  getLimitFromEntitlement,
} from "@/src/contexts/billing/types/entitlement-resolve";

import { PatchLeadAssistantSettingsHttpDto } from "../api/patch-lead-assistant-settings/patch-lead-assistant-settings.http-dto";
import {
  LeadAssistantSettingsEntity,
  LEAD_ASSISTANT_REPLY_DELAY_SECONDS,
} from "../entities/lead-assistant-settings.entity";
import { LEAD_ASSISTANT_SETTINGS_DEFAULTS } from "../constants/lead-assistant-settings.defaults";
import type { LeadAssistantSettingsResponse } from "../types/lead-assistant-settings-response";

const DEFAULTS = LEAD_ASSISTANT_SETTINGS_DEFAULTS;

@Injectable()
export class LeadAssistantSettingsService {
  constructor(
    @InjectRepository(LeadAssistantSettingsEntity)
    private readonly settings_repository: Repository<LeadAssistantSettingsEntity>,
    private readonly entitlements_service: EntitlementsService,
  ) {}

  async getForProfile(profile_id: string): Promise<LeadAssistantSettingsResponse> {
    const row = await this.settings_repository.findOne({
      where: { profile_id },
    });
    const entitlements = await this.entitlements_service.getBillingMe(profile_id);
    const replies_entry =
      entitlements.entitlements[ENTITLEMENT_FEATURE.AI_REPLIES_PER_CONVERSATION];
    const leads_entry =
      entitlements.entitlements[ENTITLEMENT_FEATURE.AI_LEAD_CONVERSATIONS];

    const replies_limit =
      replies_entry.type === "limit"
        ? replies_entry.limit ?? 0
        : replies_entry.unlimited
          ? null
          : 0;
    const leads_limit =
      leads_entry.type === "limit"
        ? leads_entry.limit ?? 0
        : leads_entry?.unlimited
          ? null
          : 0;

    const plan_includes_assistant =
      entitlements.source === "admin" ||
      (replies_limit === null || replies_limit > 0) ||
      (leads_limit === null || leads_limit > 0);

    const base = row ?? { profile_id, ...DEFAULTS };

    return {
      enabled: base.enabled,
      context_note: base.context_note,
      objective: base.objective,
      persuasion: base.persuasion,
      extension: base.extension,
      tone: base.tone,
      reply_delay_seconds: base.reply_delay_seconds,
      notify_on_reply: base.notify_on_reply,
      notify_on_quota_exhausted: base.notify_on_quota_exhausted,
      notify_on_hot_lead: base.notify_on_hot_lead,
      plan_includes_assistant,
      ai_replies_per_conversation_limit: replies_limit,
      ai_lead_conversations_limit: leads_limit,
      ai_lead_conversations_used: leads_entry.used ?? 0,
    };
  }

  async patch(
    profile_id: string,
    dto: PatchLeadAssistantSettingsHttpDto,
  ): Promise<LeadAssistantSettingsResponse> {
    const resolved = await this.entitlements_service.resolve(profile_id);
    const replies_limit = resolved.is_unlimited
      ? null
      : getLimitFromEntitlement(
          resolved.features[ENTITLEMENT_FEATURE.AI_REPLIES_PER_CONVERSATION],
        );
    const leads_limit = resolved.is_unlimited
      ? null
      : getLimitFromEntitlement(
          resolved.features[ENTITLEMENT_FEATURE.AI_LEAD_CONVERSATIONS],
        );

    const plan_includes_assistant =
      resolved.is_unlimited ||
      (replies_limit === null || replies_limit > 0) ||
      (leads_limit === null || leads_limit > 0);

    const next_enabled = dto.enabled ?? (await this.getForProfile(profile_id)).enabled;

    if (next_enabled && !plan_includes_assistant) {
      throw new BadRequestException(
        "Tu plan no incluye el asistente de leads. Amplía el plan para activarlo.",
      );
    }

    if (
      dto.reply_delay_seconds != null &&
      !LEAD_ASSISTANT_REPLY_DELAY_SECONDS.includes(
        dto.reply_delay_seconds as (typeof LEAD_ASSISTANT_REPLY_DELAY_SECONDS)[number],
      )
    ) {
      throw new BadRequestException("La espera antes de responder no es válida.");
    }

    const existing = await this.settings_repository.findOne({
      where: { profile_id },
    });

    const next_values = {
      enabled: dto.enabled ?? existing?.enabled ?? DEFAULTS.enabled,
      context_note: dto.context_note ?? existing?.context_note ?? DEFAULTS.context_note,
      objective: dto.objective ?? existing?.objective ?? DEFAULTS.objective,
      persuasion: dto.persuasion ?? existing?.persuasion ?? DEFAULTS.persuasion,
      extension: dto.extension ?? existing?.extension ?? DEFAULTS.extension,
      tone: dto.tone ?? existing?.tone ?? DEFAULTS.tone,
      reply_delay_seconds:
        dto.reply_delay_seconds ??
        existing?.reply_delay_seconds ??
        DEFAULTS.reply_delay_seconds,
      notify_on_reply:
        dto.notify_on_reply ?? existing?.notify_on_reply ?? DEFAULTS.notify_on_reply,
      notify_on_quota_exhausted:
        dto.notify_on_quota_exhausted ??
        existing?.notify_on_quota_exhausted ??
        DEFAULTS.notify_on_quota_exhausted,
      notify_on_hot_lead:
        dto.notify_on_hot_lead ??
        existing?.notify_on_hot_lead ??
        DEFAULTS.notify_on_hot_lead,
    };

    if (!existing) {
      await this.settings_repository.save({
        profile_id,
        ...next_values,
      });
      return this.getForProfile(profile_id);
    }

    const preloaded = await this.settings_repository.preload({
      profile_id,
      ...next_values,
    });

    if (!preloaded) {
      throw new BadRequestException("No se pudieron guardar los ajustes.");
    }

    await this.settings_repository.save(preloaded);
    return this.getForProfile(profile_id);
  }
}
