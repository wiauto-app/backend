import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { OutboundMailEnqueueService } from "@/src/contexts/shared/mail/outbound-mail-enqueue.service";

export interface AppraisalRequestStaffNotificationPayload {
  recipients: string[];
  appraisal: {
    vehicle_label: string;
    mileage: number;
    name: string;
    email: string;
    phone_code: string;
    phone: string;
    address: string | null;
  };
  created_at: string;
}

export interface AppraisalRequestAnsweredNotificationPayload {
  to: string;
  name: string;
  vehicle_label: string;
  estimated_price_min: number;
  estimated_price_max: number;
  admin_note: string | null;
}

@Injectable()
export class AppraisalRequestNotificationMailService {
  constructor(
    private readonly outbound_mail_enqueue_service: OutboundMailEnqueueService,
  ) {}

  async notifyStaff(payload: AppraisalRequestStaffNotificationPayload): Promise<void> {
    await Promise.all(
      payload.recipients.map((to) =>
        this.outbound_mail_enqueue_service.enqueue_appraisal_request_notification({
          to,
          appraisal: payload.appraisal,
          created_at: payload.created_at,
        }),
      ),
    );
  }

  async notifyCustomer(
    payload: AppraisalRequestAnsweredNotificationPayload,
  ): Promise<void> {
    await this.outbound_mail_enqueue_service.enqueue_appraisal_request_answered({
      to: payload.to,
      name: payload.name,
      vehicle_label: payload.vehicle_label,
      estimated_price_min: payload.estimated_price_min,
      estimated_price_max: payload.estimated_price_max,
      admin_note: payload.admin_note,
    });
  }
}
