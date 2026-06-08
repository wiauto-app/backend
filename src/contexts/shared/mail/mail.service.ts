import { existsSync, readFileSync } from "fs";
import path from "path";

import { Injectable, Logger } from "@nestjs/common";
import { MailerService } from "@nestjs-modules/mailer";

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly mailerService: MailerService) {}

  async sendEmailVerificationEmail(
    to: string,
    verificationLink: string,
    displayEmail: string,
  ): Promise<void> {
    const html = this.buildEmailVerificationTemplate(verificationLink, displayEmail);

    try {
      await this.mailerService.sendMail({
        to,
        subject: "Verificá tu correo en WiAuto",
        html,
      });
    } catch (error) {
      this.logger.error(`No se pudo enviar el correo de verificación a ${to}`, error as Error);
      throw error;
    }
  }

  async sendPasswordRecoveryEmail(to: string, recoveryLink: string): Promise<void> {
    const html = this.buildPasswordRecoveryTemplate(recoveryLink);

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
    const html = this.build_dealership_team_joined_template(payload);

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
    const html = this.build_lead_notification_template(payload);
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

  async sendDealershipInvitationEmail(payload: {
    to: string;
    invitation_link: string;
    role: string;
    dealership_id: string;
  }): Promise<void> {
    const html = this.build_dealership_invitation_template(payload);

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

  private loadVerificationEmailTemplate(): string {
    const candidates = [
      path.join(__dirname, "../../users/user-templates/verification-email.html"),
      path.join(process.cwd(), "src/contexts/users/user-templates/verification-email.html"),
    ];
    for (const filePath of candidates) {
      if (existsSync(filePath)) {
        return readFileSync(filePath, "utf8");
      }
    }
    this.logger.error("No se encontró verification-email.html en dist ni en src");
    throw new Error("Plantilla de verificación de correo no disponible");
  }

  private buildEmailVerificationTemplate(link: string, email: string): string {
    const year = String(new Date().getFullYear());
    const safeEmail = this.escapeHtml(email);
    return this.loadVerificationEmailTemplate()
      .replaceAll("{{VERIFICATION_LINK}}", link)
      .replaceAll("{{EMAIL}}", safeEmail)
      .replaceAll("{{YEAR}}", year);
  }

  private escapeHtml(text: string): string {
    return text
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  }

  private buildPasswordRecoveryTemplate(recoveryLink: string): string {
    return `<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <title>Recuperar contraseña</title>
  </head>
  <body style="font-family: Arial, sans-serif; background:#f5f5f5; margin:0; padding:24px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:8px;padding:32px;">
      <tr>
        <td>
          <h1 style="color:#111827;font-size:22px;margin:0 0 16px;">Recuperar tu cuenta</h1>
          <p style="color:#374151;font-size:15px;line-height:1.5;margin:0 0 24px;">
            Recibimos una solicitud para restablecer tu contraseña. Hacé click en el botón para continuar.
          </p>
          <p style="text-align:center;margin:32px 0;">
            <a href="${recoveryLink}"
               style="display:inline-block;padding:14px 28px;background:#1d4ed8;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:600;">
              Recuperar mi cuenta
            </a>
          </p>
          <p style="color:#6b7280;font-size:13px;line-height:1.5;margin:0;">
            Si no solicitaste este cambio, podés ignorar este mensaje. El enlace expira en 15 minutos.
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>`;
  }

  private build_lead_notification_template(payload: {
    vehicle_title: string;
    lead: {
      name: string;
      email: string;
      phone: string | null;
      phone_code: string | null;
      message: string;
    };
  }): string {
    const escaped_title = this.escapeHtml(payload.vehicle_title);
    const escaped_name = this.escapeHtml(payload.lead.name);
    const escaped_email = this.escapeHtml(payload.lead.email);
    const escaped_message = this.escapeHtml(payload.lead.message);
    const phone_display =
      payload.lead.phone_code && payload.lead.phone
        ? `${this.escapeHtml(payload.lead.phone_code)} ${this.escapeHtml(payload.lead.phone)}`
        : "No indicado";

    return `<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <title>Nueva consulta de vehículo</title>
  </head>
  <body style="font-family: Arial, sans-serif; background:#f5f5f5; margin:0; padding:24px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:8px;padding:32px;">
      <tr>
        <td>
          <h1 style="color:#111827;font-size:22px;margin:0 0 16px;">Nueva consulta recibida</h1>
          <p style="color:#374151;font-size:15px;line-height:1.5;margin:0 0 24px;">
            Recibiste una consulta sobre tu anuncio <strong>${escaped_title}</strong>.
          </p>
          <p style="color:#374151;font-size:15px;line-height:1.5;margin:0 0 8px;">
            <strong>Nombre:</strong> ${escaped_name}
          </p>
          <p style="color:#374151;font-size:15px;line-height:1.5;margin:0 0 8px;">
            <strong>Correo:</strong> ${escaped_email}
          </p>
          <p style="color:#374151;font-size:15px;line-height:1.5;margin:0 0 8px;">
            <strong>Teléfono:</strong> ${phone_display}
          </p>
          <p style="color:#374151;font-size:15px;line-height:1.5;margin:0 0 24px;">
            <strong>Mensaje:</strong><br />${escaped_message}
          </p>
          <p style="color:#6b7280;font-size:13px;line-height:1.5;margin:0;">
            Responde al interesado lo antes posible para no perder la oportunidad.
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>`;
  }

  private build_dealership_invitation_template(payload: {
    to: string;
    invitation_link: string;
    role: string;
    dealership_id: string;
  }): string {
    const escaped_email = this.escapeHtml(payload.to);
    const escaped_role = this.escapeHtml(payload.role);
    const escaped_dealership_id = this.escapeHtml(payload.dealership_id);

    return `<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <title>Invitación a concesionaria</title>
  </head>
  <body style="font-family: Arial, sans-serif; background:#f5f5f5; margin:0; padding:24px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:8px;padding:32px;">
      <tr>
        <td>
          <h1 style="color:#111827;font-size:22px;margin:0 0 16px;">Recibiste una invitación</h1>
          <p style="color:#374151;font-size:15px;line-height:1.5;margin:0 0 14px;">
            Te invitaron a formar parte de una concesionaria en WiAuto.
          </p>
          <p style="color:#374151;font-size:15px;line-height:1.5;margin:0 0 24px;">
            Correo invitado: <strong>${escaped_email}</strong><br />
            Rol: <strong>${escaped_role}</strong><br />
            ID de concesionaria: <strong>${escaped_dealership_id}</strong>
          </p>
          <p style="text-align:center;margin:32px 0;">
            <a href="${payload.invitation_link}"
               style="display:inline-block;padding:14px 28px;background:#1d4ed8;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:600;">
              Aceptar invitación
            </a>
          </p>
          <p style="color:#6b7280;font-size:13px;line-height:1.5;margin:0;">
            Si no esperabas este correo, puedes ignorarlo. El enlace expira según la política de invitaciones.
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>`;
  }

  private build_dealership_team_joined_template(payload: {
    to: string;
    role: string;
    dealership_id: string;
  }): string {
    const escaped_email = this.escapeHtml(payload.to);
    const escaped_role = this.escapeHtml(payload.role);
    const escaped_dealership_id = this.escapeHtml(payload.dealership_id);

    return `<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <title>Confirmación de ingreso</title>
  </head>
  <body style="font-family: Arial, sans-serif; background:#f5f5f5; margin:0; padding:24px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:8px;padding:32px;">
      <tr>
        <td>
          <h1 style="color:#111827;font-size:22px;margin:0 0 16px;">Te uniste al equipo</h1>
          <p style="color:#374151;font-size:15px;line-height:1.5;margin:0 0 24px;">
            Tu cuenta ya quedó vinculada correctamente a la concesionaria en WiAuto.
          </p>
          <p style="color:#374151;font-size:15px;line-height:1.5;margin:0 0 24px;">
            Correo: <strong>${escaped_email}</strong><br />
            Rol: <strong>${escaped_role}</strong><br />
            ID de concesionaria: <strong>${escaped_dealership_id}</strong>
          </p>
          <p style="color:#6b7280;font-size:13px;line-height:1.5;margin:0;">
            Si no reconoces este cambio, contacta al administrador de tu concesionaria.
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>`;
  }
}
