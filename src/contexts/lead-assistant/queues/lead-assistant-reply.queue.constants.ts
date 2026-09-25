export const LEAD_ASSISTANT_REPLY_QUEUE = "lead-assistant-reply";

export const LEAD_ASSISTANT_REPLY_JOB = "reply";

export interface LeadAssistantReplyJobData {
  chat_id: string;
  trigger_message_id: string;
  buyer_id: string;
  seller_id: string;
  vehicle_id: string;
}

export const leadAssistantReplyJobId = (
  chat_id: string,
  trigger_message_id: string,
): string => `lead-assistant-reply-${chat_id}-${trigger_message_id}`;
