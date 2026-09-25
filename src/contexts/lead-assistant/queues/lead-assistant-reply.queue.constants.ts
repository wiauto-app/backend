export const LEAD_ASSISTANT_REPLY_QUEUE = "lead-assistant-reply";

export const LEAD_ASSISTANT_REPLY_JOB = "reply";

export const LEAD_ASSISTANT_REPLY_CHANNEL = {
  CHAT: "chat",
  EMAIL: "email",
} as const;

export type LeadAssistantReplyChannel =
  (typeof LEAD_ASSISTANT_REPLY_CHANNEL)[keyof typeof LEAD_ASSISTANT_REPLY_CHANNEL];

export interface LeadAssistantReplyJobData {
  channel: LeadAssistantReplyChannel;
  lead_id: string;
  seller_id: string;
  vehicle_id: string;
  chat_id?: string;
  trigger_message_id?: string;
  buyer_id?: string;
}

export const leadAssistantReplyJobId = (
  chat_id: string,
  trigger_message_id: string,
): string => `lead-assistant-reply-${chat_id}-${trigger_message_id}`;

export const leadAssistantEmailReplyJobId = (lead_id: string): string =>
  `lead-assistant-email-${lead_id}`;
