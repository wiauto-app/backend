import { Injectable, Logger } from "@nestjs/common";
import { MailerService } from "@nestjs-modules/mailer";

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
      name: string;
      email: string;
      phone: string | null;
      phone_code: string | null;
      message: string;
    };
  }): Promise<void> {
    const html = this.mail_template_renderer.renderLeadNotification(payload);

    try {
      await this.mailerService.sendMail({
        to: payload.to,
        subject: `Nueva consulta sobre ${payload.vehicle_title}`,
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
