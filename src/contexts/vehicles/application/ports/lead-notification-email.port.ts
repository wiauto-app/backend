import { PrimitiveLead } from "../../domain/entities/lead";

export interface SendLeadNotificationEmailPayload {
  to: string;
  lead: PrimitiveLead;
  vehicle_title: string;
}

export abstract class LeadNotificationEmailService {
  abstract send_notification_email(
    payload: SendLeadNotificationEmailPayload,
  ): Promise<void>;
}
