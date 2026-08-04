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

  async sendUserWelcomeEmail(payload: {
    to: string;
    name?: string;
  }): Promise<void> {
    const html = this.mail_template_renderer.renderUserWelcome({
      name: payload.name,
      home_url: getFrontendUrl("HOME"),
    });

    try {
      await this.mailerService.sendMail({
        to: payload.to,
        subject: "Bienvenido a WiAuto",
        html,
      });
    } catch (error) {
      this.logger.error(
        `No se pudo enviar el correo de bienvenida a ${payload.to}`,
        error as Error,
      );
      throw error;
    }
  }

  async sendNewLoginEmail(payload: {
    to: string;
    ip_address?: string | null;
    user_agent?: string | null;
    occurred_at: string;
    audience: "platform" | "admin";
  }): Promise<void> {
    const html = this.mail_template_renderer.renderNewLogin({
      ip_address: payload.ip_address,
      user_agent: payload.user_agent,
      occurred_at: payload.occurred_at,
      audience: payload.audience,
      account_url: getFrontendUrl("SIGNIN"),
      recovery_url: getFrontendUrl("RESET_PASSWORD"),
    });
    const subject =
      payload.audience === "admin"
        ? "Nuevo inicio de sesión en el panel de administración"
        : "Nuevo inicio de sesión en tu cuenta";

    try {
      await this.mailerService.sendMail({
        to: payload.to,
        subject,
        html,
      });
    } catch (error) {
      this.logger.error(
        `No se pudo enviar el aviso de nuevo inicio de sesión a ${payload.to}`,
        error as Error,
      );
      throw error;
    }
  }

  async sendPasswordChangedEmail(payload: {
    to: string;
    occurred_at: string;
  }): Promise<void> {
    const html = this.mail_template_renderer.renderPasswordChanged({
      occurred_at: payload.occurred_at,
      recovery_url: getFrontendUrl("RESET_PASSWORD"),
    });

    try {
      await this.mailerService.sendMail({
        to: payload.to,
        subject: "Tu contraseña se ha actualizado",
        html,
      });
    } catch (error) {
      this.logger.error(
        `No se pudo enviar el aviso de cambio de contraseña a ${payload.to}`,
        error as Error,
      );
      throw error;
    }
  }

  async sendAccountDeletedEmail(payload: {
    to: string;
    occurred_at: string;
  }): Promise<void> {
    const html = this.mail_template_renderer.renderAccountDeleted({
      occurred_at: payload.occurred_at,
      home_url: getFrontendUrl("HOME"),
    });

    try {
      await this.mailerService.sendMail({
        to: payload.to,
        subject: "Tu cuenta de WiAuto ha sido eliminada",
        html,
      });
    } catch (error) {
      this.logger.error(
        `No se pudo enviar el aviso de eliminación de cuenta a ${payload.to}`,
        error as Error,
      );
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
    contacts_url?: string;
    vehicle?: {
      id: string;
      title: string;
      price: number | null;
      image_url: string | null;
      year: number | null;
      mileage: number | null;
      fuel_label: string;
      transmission_label: string;
      location_label: string;
      detail_url: string;
      edit_url: string;
    } | null;
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
      contacts_url: payload.contacts_url,
      vehicle: payload.vehicle ?? null,
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

  async sendNewMessageNotificationEmail(payload: {
    to: string;
    sender_name: string;
    message_excerpt: string;
    messages_url: string;
    vehicle: {
      id: string;
      title: string;
      price: number | null;
      image_url: string | null;
      year: number | null;
      mileage: number | null;
      fuel_label: string;
      transmission_label: string;
      location_label: string;
      detail_url: string;
      edit_url: string;
    } | null;
  }): Promise<void> {
    const html = this.mail_template_renderer.renderNewMessageNotification(payload);

    try {
      await this.mailerService.sendMail({
        to: payload.to,
        subject: `Nuevo mensaje de ${payload.sender_name}`,
        html,
      });
    } catch (error) {
      this.logger.error(
        `No se pudo enviar la notificación de mensaje a ${payload.to}`,
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
      cars_quantity: string;
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

  async sendSubscriptionPaymentReceivedEmail(payload: {
    to: string;
    plan_name: string;
    amount_label: string;
    currency: string;
    is_renewal: boolean;
    invoice_url: string | null;
    portal_url: string | null;
  }): Promise<void> {
    const html =
      this.mail_template_renderer.renderSubscriptionPaymentReceived(payload);
    const subject = payload.is_renewal
      ? `Renovación de ${payload.plan_name} confirmada`
      : `Pago recibido — ${payload.plan_name}`;

    try {
      await this.mailerService.sendMail({
        to: payload.to,
        subject,
        html,
      });
    } catch (error) {
      this.logger.error(
        `No se pudo enviar el correo de pago/renovación a ${payload.to}`,
        error as Error,
      );
      throw error;
    }
  }

  async sendSubscriptionPlanChangedEmail(payload: {
    to: string;
    previous_plan_name: string;
    new_plan_name: string;
    portal_url: string | null;
  }): Promise<void> {
    const html =
      this.mail_template_renderer.renderSubscriptionPlanChanged(payload);

    try {
      await this.mailerService.sendMail({
        to: payload.to,
        subject: `Cambio de plan a ${payload.new_plan_name}`,
        html,
      });
    } catch (error) {
      this.logger.error(
        `No se pudo enviar el correo de cambio de plan a ${payload.to}`,
        error as Error,
      );
      throw error;
    }
  }

  async sendListingLimitReachedEmail(payload: {
    to: string;
    max_listings: number;
    listings_used: number;
    plan_name: string | null;
    plans_url: string;
  }): Promise<void> {
    const html = this.mail_template_renderer.renderListingLimitReached(payload);

    try {
      await this.mailerService.sendMail({
        to: payload.to,
        subject: "Has alcanzado el límite de anuncios",
        html,
      });
    } catch (error) {
      this.logger.error(
        `No se pudo enviar el aviso de límite de anuncios a ${payload.to}`,
        error as Error,
      );
      throw error;
    }
  }

  async sendFeaturedPurchasedEmail(payload: {
    to: string;
    vehicle_title: string;
    featured_expires_at_label: string;
    vehicle_edit_url: string;
  }): Promise<void> {
    const html = this.mail_template_renderer.renderFeaturedPurchased(payload);

    try {
      await this.mailerService.sendMail({
        to: payload.to,
        subject: `Destacado activo: ${payload.vehicle_title}`,
        html,
      });
    } catch (error) {
      this.logger.error(
        `No se pudo enviar el correo de compra de destacado a ${payload.to}`,
        error as Error,
      );
      throw error;
    }
  }

  async sendFeaturedExpiredEmail(payload: {
    to: string;
    vehicle_title: string;
    vehicle_edit_url: string;
  }): Promise<void> {
    const html = this.mail_template_renderer.renderFeaturedExpired(payload);

    try {
      await this.mailerService.sendMail({
        to: payload.to,
        subject: `El destacado de ${payload.vehicle_title} ha finalizado`,
        html,
      });
    } catch (error) {
      this.logger.error(
        `No se pudo enviar el correo de vencimiento de destacado a ${payload.to}`,
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

  async sendSellerVehicleStatusEmail(
    payload: {
      to: string;
      vehicle: {
        id: string;
        title: string;
        price: number | null;
        image_url: string | null;
        year: number | null;
        mileage: number | null;
        fuel_label: string;
        transmission_label: string;
        location_label: string;
        detail_url: string;
        edit_url: string;
      };
      status_change_message?: string | null;
      expires_at_label?: string | null;
    },
    theme:
      | "published"
      | "approved"
      | "rejected"
      | "deactivated"
      | "sold"
      | "archived"
      | "expiry_soon"
      | "expired",
  ): Promise<void> {
    const cta = this.resolveSellerStatusCta(theme, payload.vehicle);
    const html = this.mail_template_renderer.renderSellerStatusMail({
      theme,
      vehicle: payload.vehicle,
      status_change_message: payload.status_change_message ?? null,
      expires_at_label: payload.expires_at_label ?? null,
      cta_label: cta.label,
      cta_href: cta.href,
    });

    const subject_map: Record<typeof theme, string> = {
      published: `Anuncio publicado: ${payload.vehicle.title}`,
      approved: `Anuncio aprobado: ${payload.vehicle.title}`,
      rejected: `Anuncio rechazado: ${payload.vehicle.title}`,
      deactivated: `Anuncio desactivado: ${payload.vehicle.title}`,
      sold: `Anuncio marcado como vendido: ${payload.vehicle.title}`,
      archived: `Anuncio archivado: ${payload.vehicle.title}`,
      expiry_soon: `Tu anuncio caduca pronto: ${payload.vehicle.title}`,
      expired: `Anuncio caducado: ${payload.vehicle.title}`,
    };

    try {
      await this.mailerService.sendMail({
        to: payload.to,
        subject: subject_map[theme],
        html,
      });
    } catch (error) {
      this.logger.error(
        `No se pudo enviar el correo de estado (${theme}) a ${payload.to}`,
        error as Error,
      );
      throw error;
    }
  }

  private resolveSellerStatusCta(
    theme:
      | "published"
      | "approved"
      | "rejected"
      | "deactivated"
      | "sold"
      | "archived"
      | "expiry_soon"
      | "expired",
    vehicle: { detail_url: string; edit_url: string },
  ): { label: string; href: string } {
    if (theme === "published" || theme === "approved") {
      return { label: "Ver mi anuncio", href: vehicle.detail_url };
    }
    if (theme === "rejected") {
      return { label: "Editar y volver a publicar", href: vehicle.edit_url };
    }
    if (theme === "expiry_soon" || theme === "expired") {
      return { label: "Renovar anuncio", href: getFrontendUrl("MY_LISTINGS") };
    }
    return { label: "Mis anuncios", href: getFrontendUrl("MY_LISTINGS") };
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

  async sendAppraisalRequestNotificationEmail(payload: {
    to: string;
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
  }): Promise<void> {
    const html = this.mail_template_renderer.renderAppraisalRequestNotification(payload);

    try {
      await this.mailerService.sendMail({
        to: payload.to,
        subject: `Nueva solicitud de tasación: ${payload.appraisal.vehicle_label}`,
        html,
      });
    } catch (error) {
      this.logger.error(
        `No se pudo enviar la notificación de solicitud de tasación a ${payload.to}`,
        error as Error,
      );
      throw error;
    }
  }

  async sendAppraisalRequestAnsweredEmail(payload: {
    to: string;
    name: string;
    vehicle_label: string;
    estimated_price_min: number;
    estimated_price_max: number;
    admin_note: string | null;
  }): Promise<void> {
    const html = this.mail_template_renderer.renderAppraisalRequestAnswered(payload);

    try {
      await this.mailerService.sendMail({
        to: payload.to,
        subject: `Ya tenemos una estimación para tu ${payload.vehicle_label}`,
        html,
      });
    } catch (error) {
      this.logger.error(
        `No se pudo enviar la respuesta de tasación a ${payload.to}`,
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
