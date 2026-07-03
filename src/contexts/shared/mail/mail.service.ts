import { Injectable, Logger } from "@nestjs/common";
import { MailerService } from "@nestjs-modules/mailer";

import { getFrontendUrl } from "@/src/common/frontend-routes";
import { MailTemplateRenderer } from "./mail-template.renderer";

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(
    private readonly mailerService: MailerService,
    private readonly mail_template_renderer: MailTemplateRenderer,
  ) {}

  async sendEmailVerificationEmail(
    to: string,
    verificationLink: string,
    displayEmail: string,
  ): Promise<void> {
    const html = this.mail_template_renderer.renderEmailVerification(
      verificationLink,
      displayEmail,
    );

    try {
      await this.mailerService.sendMail({
        to,
        subject: "Verifica tu correo en WiAuto",
        html,
      });
    } catch (error) {
      this.logger.error(`No se pudo enviar el correo de verificación a ${to}`, error as Error);
      throw error;
    }
  }

  async sendPasswordRecoveryEmail(to: string, recoveryLink: string): Promise<void> {
    const html = this.mail_template_renderer.renderPasswordRecovery(recoveryLink);

    try {
      await this.mailerService.sendMail({
        to,
        subject: "Recuperar tu contraseña",
        html,
      });
    } catch (error) {
      this.logger.error(`No se pudo enviar el correo de recuperación a ${to}`, error as Error);
      throw error;
    }
  }

  async sendDealershipTeamJoinedEmail(payload: {
    to: string;
    role: string;
    dealership_id: string;
  }): Promise<void> {
    const html = this.mail_template_renderer.renderDealershipTeamJoined(payload);

    try {
      await this.mailerService.sendMail({
        to: payload.to,
        subject: "Confirmación: ya formas parte del equipo en WiAuto",
        html,
      });
    } catch (error) {
      this.logger.error(
        `No se pudo enviar la confirmación de ingreso a concesionaria a ${payload.to}`,
        error as Error,
      );
      throw error;
    }
  }

  async sendLeadNotificationEmail(payload: {
    to: string;
    vehicle_title: string;
    lead: {
      type: string;
      name: string;
      email: string | null;
      phone: string | null;
      phone_code: string | null;
      message: string | null;
      callback_scheduled_at: Date | string | null;
    };
  }): Promise<void> {
    const html = this.mail_template_renderer.renderLeadNotification({
      vehicle_title: payload.vehicle_title,
      lead: {
        type: payload.lead.type,
        name: payload.lead.name,
        email: payload.lead.email,
        phone: payload.lead.phone,
        phone_code: payload.lead.phone_code,
        message: payload.lead.message,
        callback_scheduled_at: payload.lead.callback_scheduled_at
          ? new Date(payload.lead.callback_scheduled_at).toISOString().slice(0, 10)
          : null,
      },
    });

    const is_call_me = payload.lead.type === "call_me";

    try {
      await this.mailerService.sendMail({
        to: payload.to,
        subject: is_call_me
          ? `Solicitud de llamada sobre ${payload.vehicle_title}`
          : `Nueva consulta sobre ${payload.vehicle_title}`,
        html,
      });
    } catch (error) {
      this.logger.error(
        `No se pudo enviar la notificación de lead a ${payload.to}`,
        error as Error,
      );
      throw error;
    }
  }

  async sendPlanLeadRequestNotificationEmail(payload: {
    to: string;
    lead: {
      name: string;
      email: string;
      phone: string;
      message: string | null;
    };
    created_at: string;
  }): Promise<void> {
    const html = this.mail_template_renderer.renderPlanLeadRequestNotification(payload);

    try {
      await this.mailerService.sendMail({
        to: payload.to,
        subject: "Nueva solicitud de información sobre planes",
        html,
      });
    } catch (error) {
      this.logger.error(
        `No se pudo enviar la notificación de solicitud de plan a ${payload.to}`,
        error as Error,
      );
      throw error;
    }
  }

  async sendSubscriptionWelcomeEmail(payload: {
    to: string;
    plan_name: string;
    is_new_guest_user: boolean;
    temporary_password?: string;
  }): Promise<void> {
    const html = this.mail_template_renderer.renderSubscriptionWelcome({
      plan_name: payload.plan_name,
      is_new_guest_user: payload.is_new_guest_user,
      temporary_password: payload.temporary_password,
      login_url: getFrontendUrl("SIGNIN"),
    });

    try {
      await this.mailerService.sendMail({
        to: payload.to,
        subject: `Tu plan ${payload.plan_name} ya está activo`,
        html,
      });
    } catch (error) {
      this.logger.error(
        `No se pudo enviar el correo de bienvenida de suscripción a ${payload.to}`,
        error as Error,
      );
      throw error;
    }
  }

  async sendSubscriptionCancelScheduledEmail(payload: {
    to: string;
    plan_name: string;
    period_end: string;
    portal_url: string;
  }): Promise<void> {
    const html = this.mail_template_renderer.renderSubscriptionCancelScheduled(payload);

    try {
      await this.mailerService.sendMail({
        to: payload.to,
        subject: `Cancelación programada de ${payload.plan_name}`,
        html,
      });
    } catch (error) {
      this.logger.error(
        `No se pudo enviar el correo de cancelación programada a ${payload.to}`,
        error as Error,
      );
      throw error;
    }
  }

  async sendSubscriptionEndedEmail(payload: {
    to: string;
    plan_name: string;
  }): Promise<void> {
    const html = this.mail_template_renderer.renderSubscriptionEnded(payload);

    try {
      await this.mailerService.sendMail({
        to: payload.to,
        subject: `Tu suscripción a ${payload.plan_name} ha finalizado`,
        html,
      });
    } catch (error) {
      this.logger.error(
        `No se pudo enviar el correo de suscripción finalizada a ${payload.to}`,
        error as Error,
      );
      throw error;
    }
  }

  async sendCheckoutAbandonedEmail(payload: {
    to: string;
    plan_name: string | null;
    plans_url: string;
  }): Promise<void> {
    const html = this.mail_template_renderer.renderCheckoutAbandoned(payload);

    try {
      await this.mailerService.sendMail({
        to: payload.to,
        subject: "¿Seguimos con tu plan en WiAuto?",
        html,
      });
    } catch (error) {
      this.logger.error(
        `No se pudo enviar el correo de checkout abandonado a ${payload.to}`,
        error as Error,
      );
      throw error;
    }
  }

  async sendSubscriptionPaymentFailedEmail(payload: {
    to: string;
    plan_name: string | null;
    portal_url: string | null;
  }): Promise<void> {
    const html = this.mail_template_renderer.renderSubscriptionPaymentFailed(payload);

    try {
      await this.mailerService.sendMail({
        to: payload.to,
        subject: "Problema con el pago de tu suscripción",
        html,
      });
    } catch (error) {
      this.logger.error(
        `No se pudo enviar el aviso de pago fallido a ${payload.to}`,
        error as Error,
      );
      throw error;
    }
  }

  async sendVehicleStatusChangedEmail(payload: {
    to: string;
    vehicle_title: string;
    previous_status_label: string;
    new_status_label: string;
    status_change_message: string | null;
  }): Promise<void> {
    const html = this.mail_template_renderer.renderVehicleStatusChanged(payload);

    try {
      await this.mailerService.sendMail({
        to: payload.to,
        subject: `Actualización de tu anuncio: ${payload.vehicle_title}`,
        html,
      });
    } catch (error) {
      this.logger.error(
        `No se pudo enviar la notificación de cambio de estado a ${payload.to}`,
        error as Error,
      );
      throw error;
    }
  }

  async sendAlertMatchNotificationEmail(payload: {
    to: string;
    alert_name: string;
    vehicle_title: string;
    vehicle_price: number;
    vehicle_detail_url: string;
    vehicle_image_url: string | null;
    vehicle_year: number;
    vehicle_mileage: number;
    vehicle_fuel_label: string;
    vehicle_transmission_label: string;
    vehicle_location_label: string;
  }): Promise<void> {
    const html = this.mail_template_renderer.renderAlertMatch(payload);

    try {
      await this.mailerService.sendMail({
        to: payload.to,
        subject: `Nuevo anuncio que coincide con «${payload.alert_name}»`,
        html,
      });
    } catch (error) {
      this.logger.error(
        `No se pudo enviar la notificación de alerta a ${payload.to}`,
        error as Error,
      );
      throw error;
    }
  }

  async sendAlertEventNotificationEmail(payload: {
    to: string;
    event_type: string;
    title: string;
    body_summary: string;
    vehicle_detail_url: string;
    vehicle_image_url: string | null;
    alert_name: string | null;
  }): Promise<void> {
    const html = this.mail_template_renderer.renderAlertEvent(payload);

    try {
      await this.mailerService.sendMail({
        to: payload.to,
        subject: payload.title,
        html,
      });
    } catch (error) {
      this.logger.error(
        `No se pudo enviar la notificación de evento a ${payload.to}`,
        error as Error,
      );
      throw error;
    }
  }

  async sendAlertDigestNotificationEmail(payload: {
    to: string;
    frequency: "daily" | "weekly";
    events_count: number;
    events: Array<{
      event_type: string;
      title: string;
      summary: string;
    }>;
  }): Promise<void> {
    const html = this.mail_template_renderer.renderAlertDigest(payload);
    const frequency_label = payload.frequency === "daily" ? "diario" : "semanal";

    try {
      await this.mailerService.sendMail({
        to: payload.to,
        subject: `Resumen ${frequency_label} de alertas (${payload.events_count})`,
        html,
      });
    } catch (error) {
      this.logger.error(
        `No se pudo enviar el digest de alertas a ${payload.to}`,
        error as Error,
      );
      throw error;
    }
  }

  async sendDealershipInvitationEmail(payload: {
    to: string;
    invitation_link: string;
    reject_link: string;
    role: string;
    dealership_id: string;
  }): Promise<void> {
    const html = this.mail_template_renderer.renderDealershipInvitation(payload);

    try {
      await this.mailerService.sendMail({
        to: payload.to,
        subject: "Invitación a concesionaria en WiAuto",
        html,
      });
    } catch (error) {
      this.logger.error(`No se pudo enviar la invitación de concesionaria a ${payload.to}`, error as Error);
      throw error;
    }
  }
}
