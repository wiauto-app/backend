import { existsSync, readFileSync } from "fs";
import { join } from "path";

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

  private loadVerificationEmailTemplate(): string {
    const candidates = [
      join(__dirname, "../../users/user-templates/verification-email.html"),
      join(process.cwd(), "src/contexts/users/user-templates/verification-email.html"),
    ];
    for (const filePath of candidates) {
      if (existsSync(filePath)) {
        return readFileSync(filePath, "utf-8");
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
}
