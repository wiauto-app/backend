export interface LeadAssistantSettingsResponse {
  enabled: boolean;
  context_note: string;
  objective: string;
  persuasion: string;
  extension: string;
  tone: string;
  reply_delay_seconds: number;
  notify_on_reply: boolean;
  notify_on_quota_exhausted: boolean;
  notify_on_hot_lead: boolean;
  plan_includes_assistant: boolean;
  ai_replies_per_conversation_limit: number | null;
  ai_lead_conversations_limit: number | null;
  ai_lead_conversations_used: number;
}
