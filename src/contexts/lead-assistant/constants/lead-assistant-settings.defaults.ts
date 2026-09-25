import type { LeadAssistantSettingsEntity } from "../entities/lead-assistant-settings.entity";

export const LEAD_ASSISTANT_SETTINGS_DEFAULTS: Omit<
  LeadAssistantSettingsEntity,
  "profile_id" | "profile" | "created_at" | "updated_at"
> = {
  enabled: false,
  context_note: "",
  objective: "anyone",
  persuasion: "balanced",
  extension: "medium",
  tone: "professional",
  reply_delay_seconds: 30,
  notify_on_reply: true,
  notify_on_quota_exhausted: true,
  notify_on_hot_lead: true,
};

export const mergeLeadAssistantSettings = (
  profile_id: string,
  row: LeadAssistantSettingsEntity | null,
): LeadAssistantSettingsEntity =>
  ({
    profile_id,
    ...LEAD_ASSISTANT_SETTINGS_DEFAULTS,
    ...row,
  }) as LeadAssistantSettingsEntity;
