import { existsSync, readFileSync } from "fs";
import path from "path";

import { Injectable, Logger } from "@nestjs/common";

import {
  formatCurrencyEur,
  formatLocationLabel,
  formatMileage,
  formatTransmissionLabel,
  humanizeSlug,
} from "./mail-template.format";

export interface RenderBaseOptions {
  preheader: string;
  title: string;
  body: string;
  cta_label?: string;
  cta_href?: string;
  footer_note?: string;
}

export interface AlertMatchRenderPayload {
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
}

@Injectable()
export class MailTemplateRenderer {
  private readonly logger = new Logger(MailTemplateRenderer.name);

  escapeHtml(text: string): string {
    return text
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  }

  renderBase(options: RenderBaseOptions): string {
    const year = String(new Date().getFullYear());
    const cta_block = this.buildCtaBlock(options.cta_label, options.cta_href);
    const footer_note = options.footer_note
      ? `<p style="margin:24px 0 0;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;font-size:13px;line-height:1.55;color:#6b7280;">${options.footer_note}</p>`
      : "";

    return this.render("base-email.html", {
      PREHEADER: this.escapeHtml(options.preheader),
      TITLE: this.escapeHtml(options.title),
      BODY: options.body,
      CTA_BLOCK: cta_block,
      FOOTER_NOTE: footer_note,
      YEAR: year,
    });
  }

  renderEmailVerification(verification_link: string, email: string): string {
    const body = this.render("verification-body.html", {
      EMAIL: this.escapeHtml(email),
      VERIFICATION_LINK: verification_link,
    });

    return this.renderBase({
      preheader: "Confirma tu correo para activar tu cuenta en WiAuto.",
      title: "Confirma tu dirección de correo",
      body,
      cta_label: "Verificar correo",
      cta_href: verification_link,
      footer_note:
        "Si no creaste una cuenta en WiAuto, ignora este mensaje. No hace falta que hagas nada más.",
    });
  }

  renderPasswordRecovery(recovery_link: string): string {
    const body = `<p style="margin:0 0 24px;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;font-size:15px;line-height:1.6;color:#374151;">
      Recibimos una solicitud para restablecer tu contraseña. Haz clic en el botón para continuar.
    </p>`;

    return this.renderBase({
      preheader: "Restablece tu contraseña de WiAuto.",
      title: "Recuperar tu cuenta",
      body,
      cta_label: "Recuperar mi cuenta",
      cta_href: recovery_link,
      footer_note:
        "Si no solicitaste este cambio, puedes ignorar este mensaje. El enlace expira en 15 minutos.",
    });
  }

  renderLeadNotification(payload: {
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

    const body = `<p style="margin:0 0 24px;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;font-size:15px;line-height:1.6;color:#374151;">
        Recibiste una consulta sobre tu anuncio <strong style="color:#111827;">${escaped_title}</strong>.
      </p>
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border:1px solid #e5e7eb;border-radius:8px;">
        <tr>
          <td style="padding:16px 20px;border-bottom:1px solid #e5e7eb;">
            <p style="margin:0;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;font-size:12px;color:#6b7280;">Nombre</p>
            <p style="margin:4px 0 0;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;font-size:15px;color:#111827;">${escaped_name}</p>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 20px;border-bottom:1px solid #e5e7eb;">
            <p style="margin:0;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;font-size:12px;color:#6b7280;">Correo</p>
            <p style="margin:4px 0 0;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;font-size:15px;color:#111827;">${escaped_email}</p>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 20px;border-bottom:1px solid #e5e7eb;">
            <p style="margin:0;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;font-size:12px;color:#6b7280;">Teléfono</p>
            <p style="margin:4px 0 0;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;font-size:15px;color:#111827;">${phone_display}</p>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 20px;">
            <p style="margin:0;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;font-size:12px;color:#6b7280;">Mensaje</p>
            <p style="margin:4px 0 0;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;font-size:15px;line-height:1.5;color:#111827;">${escaped_message}</p>
          </td>
        </tr>
      </table>`;

    return this.renderBase({
      preheader: `Nueva consulta sobre ${payload.vehicle_title}.`,
      title: "Nueva consulta recibida",
      body,
      footer_note:
        "Responde al interesado lo antes posible para no perder la oportunidad.",
    });
  }

  renderPlanLeadRequestNotification(payload: {
    lead: {
      name: string;
      email: string;
      phone: string;
      message: string | null;
    };
    created_at: string;
  }): string {
    const escaped_name = this.escapeHtml(payload.lead.name);
    const escaped_email = this.escapeHtml(payload.lead.email);
    const escaped_phone = this.escapeHtml(payload.lead.phone);
    const escaped_message = payload.lead.message
      ? this.escapeHtml(payload.lead.message)
      : "Sin mensaje";
    const escaped_created_at = this.escapeHtml(
      new Date(payload.created_at).toLocaleString("es-ES", {
        dateStyle: "medium",
        timeStyle: "short",
      }),
    );

    const body = `<p style="margin:0 0 24px;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;font-size:15px;line-height:1.6;color:#374151;">
        Recibiste una nueva solicitud de información sobre planes profesionales.
      </p>
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border:1px solid #e5e7eb;border-radius:8px;">
        <tr>
          <td style="padding:16px 20px;border-bottom:1px solid #e5e7eb;">
            <p style="margin:0;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;font-size:12px;color:#6b7280;">Nombre</p>
            <p style="margin:4px 0 0;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;font-size:15px;color:#111827;">${escaped_name}</p>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 20px;border-bottom:1px solid #e5e7eb;">
            <p style="margin:0;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;font-size:12px;color:#6b7280;">Correo</p>
            <p style="margin:4px 0 0;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;font-size:15px;color:#111827;">${escaped_email}</p>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 20px;border-bottom:1px solid #e5e7eb;">
            <p style="margin:0;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;font-size:12px;color:#6b7280;">Teléfono</p>
            <p style="margin:4px 0 0;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;font-size:15px;color:#111827;">${escaped_phone}</p>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 20px;border-bottom:1px solid #e5e7eb;">
            <p style="margin:0;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;font-size:12px;color:#6b7280;">Mensaje</p>
            <p style="margin:4px 0 0;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;font-size:15px;line-height:1.5;color:#111827;">${escaped_message}</p>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 20px;">
            <p style="margin:0;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;font-size:12px;color:#6b7280;">Fecha</p>
            <p style="margin:4px 0 0;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;font-size:15px;color:#111827;">${escaped_created_at}</p>
          </td>
        </tr>
      </table>`;

    return this.renderBase({
      preheader: "Nueva solicitud de información sobre planes profesionales.",
      title: "Nueva solicitud de plan",
      body,
      footer_note: "Contacta al interesado lo antes posible.",
    });
  }

  renderSubscriptionWelcome(payload: {
    plan_name: string;
    is_new_guest_user: boolean;
    temporary_password?: string;
    login_url: string;
  }): string {
    const escaped_plan = this.escapeHtml(payload.plan_name);
    const credentials_block =
      payload.is_new_guest_user && payload.temporary_password
        ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:24px 0;border:1px solid #e5e7eb;border-radius:8px;">
            <tr>
              <td style="padding:16px 20px;">
                <p style="margin:0 0 8px;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;font-size:12px;color:#6b7280;">Contraseña temporal</p>
                <p style="margin:0;font-family:monospace;font-size:16px;color:#111827;">${this.escapeHtml(payload.temporary_password)}</p>
              </td>
            </tr>
          </table>
          <p style="margin:0 0 24px;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;font-size:15px;line-height:1.6;color:#374151;">
            Te recomendamos cambiar tu contraseña después de iniciar sesión.
          </p>`
        : `<p style="margin:0 0 24px;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;font-size:15px;line-height:1.6;color:#374151;">
            Ya puedes disfrutar de las ventajas de tu plan desde tu cuenta.
          </p>`;

    const body = `<p style="margin:0 0 24px;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;font-size:15px;line-height:1.6;color:#374151;">
        Tu suscripción al plan <strong style="color:#111827;">${escaped_plan}</strong> está activa.
      </p>
      ${credentials_block}`;

    return this.renderBase({
      preheader: `Tu plan ${payload.plan_name} ya está activo.`,
      title: "Suscripción activada",
      body,
      cta_label: "Iniciar sesión",
      cta_href: payload.login_url,
      footer_note: "Gracias por confiar en WiAuto.",
    });
  }

  renderSubscriptionCancelScheduled(payload: {
    plan_name: string;
    period_end: string;
    portal_url: string;
  }): string {
    const escaped_plan = this.escapeHtml(payload.plan_name);
    const escaped_period_end = this.escapeHtml(payload.period_end);

    const body = `<p style="margin:0 0 24px;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;font-size:15px;line-height:1.6;color:#374151;">
        Has programado la cancelación de tu plan <strong style="color:#111827;">${escaped_plan}</strong>.
        Mantendrás el acceso premium hasta el <strong style="color:#111827;">${escaped_period_end}</strong>.
      </p>
      <p style="margin:0 0 24px;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;font-size:15px;line-height:1.6;color:#374151;">
        Si cambias de opinión, puedes reactivar tu suscripción desde el portal de facturación.
      </p>`;

    return this.renderBase({
      preheader: `Tu plan ${payload.plan_name} se cancelará al final del periodo.`,
      title: "Cancelación programada",
      body,
      cta_label: "Gestionar suscripción",
      cta_href: payload.portal_url,
      footer_note: "Conservarás tu rol premium hasta la fecha indicada.",
    });
  }

  renderSubscriptionEnded(payload: { plan_name: string }): string {
    const escaped_plan = this.escapeHtml(payload.plan_name);

    const body = `<p style="margin:0 0 24px;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;font-size:15px;line-height:1.6;color:#374151;">
        Tu suscripción al plan <strong style="color:#111827;">${escaped_plan}</strong> ha finalizado.
        Tu cuenta volvió al perfil particular y al rol gratuito.
      </p>
      <p style="margin:0;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;font-size:15px;line-height:1.6;color:#374151;">
        Puedes contratar un plan de nuevo cuando quieras desde la sección de planes.
      </p>`;

    return this.renderBase({
      preheader: `Tu plan ${payload.plan_name} ha finalizado.`,
      title: "Suscripción finalizada",
      body,
      footer_note: "Gracias por haber sido cliente premium de WiAuto.",
    });
  }

  renderCheckoutAbandoned(payload: {
    plan_name: string | null;
    plans_url: string;
  }): string {
    const plan_line = payload.plan_name
      ? ` el plan <strong style="color:#111827;">${this.escapeHtml(payload.plan_name)}</strong>`
      : " un plan profesional";

    const body = `<p style="margin:0 0 24px;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;font-size:15px;line-height:1.6;color:#374151;">
        Notamos que no completaste la contratación de${plan_line}.
      </p>
      <p style="margin:0;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;font-size:15px;line-height:1.6;color:#374151;">
        Puedes retomar el proceso cuando quieras.
      </p>`;

    return this.renderBase({
      preheader: "Retoma tu contratación de plan en WiAuto.",
      title: "¿Seguimos con tu plan?",
      body,
      cta_label: "Ver planes",
      cta_href: payload.plans_url,
      footer_note: "Si ya completaste el pago, ignora este mensaje.",
    });
  }

  renderSubscriptionPaymentFailed(payload: {
    plan_name: string | null;
    portal_url: string | null;
  }): string {
    const plan_line = payload.plan_name
      ? ` del plan <strong style="color:#111827;">${this.escapeHtml(payload.plan_name)}</strong>`
      : " de tu suscripción";

    const body = `<p style="margin:0 0 24px;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;font-size:15px;line-height:1.6;color:#374151;">
        No pudimos procesar el último pago${plan_line}.
      </p>
      <p style="margin:0;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;font-size:15px;line-height:1.6;color:#374151;">
        Actualiza tu método de pago lo antes posible para evitar interrupciones.
        Mantendrás tu acceso premium mientras Stripe reintenta el cobro.
      </p>`;

    return this.renderBase({
      preheader: "Acción requerida: revisa tu método de pago.",
      title: "Problema con tu pago",
      body,
      ...(payload.portal_url
        ? { cta_label: "Actualizar método de pago", cta_href: payload.portal_url }
        : {}),
      footer_note: "Si ya resolviste el pago, puedes ignorar este aviso.",
    });
  }

  renderVehicleStatusChanged(payload: {
    vehicle_title: string;
    previous_status_label: string;
    new_status_label: string;
    status_change_message: string | null;
  }): string {
    const escaped_title = this.escapeHtml(payload.vehicle_title);
    const escaped_previous = this.escapeHtml(payload.previous_status_label);
    const escaped_new = this.escapeHtml(payload.new_status_label);
    const message_block = payload.status_change_message
      ? `<p style="margin:0 0 24px;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;font-size:15px;line-height:1.6;color:#374151;">
            <strong style="color:#111827;">Mensaje del equipo:</strong><br />${this.escapeHtml(payload.status_change_message)}
          </p>`
      : "";

    const body = `<p style="margin:0 0 24px;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;font-size:15px;line-height:1.6;color:#374151;">
        El anuncio <strong style="color:#111827;">${escaped_title}</strong> pasó de <strong style="color:#111827;">${escaped_previous}</strong> a <strong style="color:#111827;">${escaped_new}</strong>.
      </p>
      ${message_block}`;

    return this.renderBase({
      preheader: `Tu anuncio ${payload.vehicle_title} cambió de estado.`,
      title: "Tu anuncio cambió de estado",
      body,
      footer_note:
        "Si tienes dudas, responde a este correo o contacta al soporte de WiAuto.",
    });
  }

  renderDealershipInvitation(payload: {
    to: string;
    invitation_link: string;
    reject_link: string;
    role: string;
    dealership_id: string;
  }): string {
    const escaped_email = this.escapeHtml(payload.to);
    const escaped_role = this.escapeHtml(payload.role);
    const escaped_dealership_id = this.escapeHtml(payload.dealership_id);
    const escaped_reject_link = this.escapeHtml(payload.reject_link);

    const body = `<p style="margin:0 0 24px;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;font-size:15px;line-height:1.6;color:#374151;">
        Te invitaron a formar parte de una concesionaria en WiAuto.
      </p>
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border:1px solid #e5e7eb;border-radius:8px;">
        <tr>
          <td style="padding:16px 20px;border-bottom:1px solid #e5e7eb;">
            <p style="margin:0;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;font-size:12px;color:#6b7280;">Correo invitado</p>
            <p style="margin:4px 0 0;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;font-size:15px;color:#111827;">${escaped_email}</p>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 20px;border-bottom:1px solid #e5e7eb;">
            <p style="margin:0;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;font-size:12px;color:#6b7280;">Rol</p>
            <p style="margin:4px 0 0;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;font-size:15px;color:#111827;">${escaped_role}</p>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 20px;">
            <p style="margin:0;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;font-size:12px;color:#6b7280;">ID de concesionaria</p>
            <p style="margin:4px 0 0;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;font-size:15px;color:#111827;">${escaped_dealership_id}</p>
          </td>
        </tr>
      </table>
      <p style="margin:24px 0 0;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;font-size:14px;line-height:1.6;color:#6b7280;">
        Si no deseas unirte, puedes
        <a href="${escaped_reject_link}" style="color:#2563eb;text-decoration:underline;">rechazar la invitación</a>.
      </p>`;

    return this.renderBase({
      preheader: "Te invitaron a unirte a una concesionaria en WiAuto.",
      title: "Recibiste una invitación",
      body,
      cta_label: "Aceptar invitación",
      cta_href: payload.invitation_link,
      footer_note:
        "Si no esperabas este correo, puedes ignorarlo o rechazar la invitación. El enlace expira según la política de invitaciones.",
    });
  }

  renderDealershipTeamJoined(payload: {
    to: string;
    role: string;
    dealership_id: string;
  }): string {
    const escaped_email = this.escapeHtml(payload.to);
    const escaped_role = this.escapeHtml(payload.role);
    const escaped_dealership_id = this.escapeHtml(payload.dealership_id);

    const body = `<p style="margin:0 0 24px;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;font-size:15px;line-height:1.6;color:#374151;">
        Tu cuenta ya quedó vinculada correctamente a la concesionaria en WiAuto.
      </p>
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border:1px solid #e5e7eb;border-radius:8px;">
        <tr>
          <td style="padding:16px 20px;border-bottom:1px solid #e5e7eb;">
            <p style="margin:0;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;font-size:12px;color:#6b7280;">Correo</p>
            <p style="margin:4px 0 0;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;font-size:15px;color:#111827;">${escaped_email}</p>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 20px;border-bottom:1px solid #e5e7eb;">
            <p style="margin:0;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;font-size:12px;color:#6b7280;">Rol</p>
            <p style="margin:4px 0 0;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;font-size:15px;color:#111827;">${escaped_role}</p>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 20px;">
            <p style="margin:0;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;font-size:12px;color:#6b7280;">ID de concesionaria</p>
            <p style="margin:4px 0 0;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;font-size:15px;color:#111827;">${escaped_dealership_id}</p>
          </td>
        </tr>
      </table>`;

    return this.renderBase({
      preheader: "Confirmación: ya formas parte del equipo en WiAuto.",
      title: "Te uniste al equipo",
      body,
      footer_note:
        "Si no reconoces este cambio, contacta al administrador de tu concesionaria.",
    });
  }

  renderAlertMatch(payload: AlertMatchRenderPayload): string {
    const alert_body = this.render("alert-match-body.html", {
      ALERT_NAME: this.escapeHtml(payload.alert_name),
      VEHICLE_TITLE: this.escapeHtml(payload.vehicle_title),
      VEHICLE_PRICE: formatCurrencyEur(payload.vehicle_price),
      VEHICLE_YEAR: String(payload.vehicle_year),
      VEHICLE_MILEAGE: formatMileage(payload.vehicle_mileage),
      VEHICLE_FUEL: this.escapeHtml(payload.vehicle_fuel_label),
      VEHICLE_TRANSMISSION: this.escapeHtml(payload.vehicle_transmission_label),
      VEHICLE_LOCATION: this.escapeHtml(payload.vehicle_location_label),
      VEHICLE_IMAGE_BLOCK: this.buildVehicleImageBlock(payload.vehicle_image_url),
      VEHICLE_DETAIL_URL: payload.vehicle_detail_url,
    });

    return this.renderBase({
      preheader: `Nuevo anuncio para tu alerta ${payload.alert_name}.`,
      title: "Nuevo anuncio para tu alerta",
      body: alert_body,
      cta_label: "Ver anuncio",
      cta_href: payload.vehicle_detail_url,
    });
  }

  renderAlertEvent(payload: {
    event_type: string;
    title: string;
    body_summary: string;
    vehicle_detail_url: string;
    vehicle_image_url: string | null;
    alert_name: string | null;
  }): string {
    const alert_line = payload.alert_name
      ? `<p style="margin:0 0 16px;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;font-size:14px;color:#374151;">Alerta: <strong>${this.escapeHtml(payload.alert_name)}</strong></p>`
      : "";

    const body = `${alert_line}
      <p style="margin:0 0 16px;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;font-size:15px;line-height:1.6;color:#374151;">
        ${this.escapeHtml(payload.body_summary)}
      </p>
      ${this.buildVehicleImageBlock(payload.vehicle_image_url)}`;

    return this.renderBase({
      preheader: payload.body_summary,
      title: this.escapeHtml(payload.title),
      body,
      cta_label: "Ver detalle",
      cta_href: payload.vehicle_detail_url,
    });
  }

  renderAlertDigest(payload: {
    frequency: "daily" | "weekly";
    events_count: number;
    events: Array<{ event_type: string; title: string; summary: string }>;
  }): string {
    const items = payload.events
      .map(
        (event) => `<li style="margin:0 0 12px;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;font-size:14px;color:#374151;">
          <strong>${this.escapeHtml(event.title)}</strong><br />
          ${this.escapeHtml(event.summary)}
        </li>`,
      )
      .join("");

    const body = `<p style="margin:0 0 16px;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;font-size:15px;color:#374151;">
        Tienes ${payload.events_count} notificaciones pendientes.
      </p>
      <ul style="margin:0;padding-left:20px;">${items}</ul>`;

    const frequency_label = payload.frequency === "daily" ? "diario" : "semanal";

    return this.renderBase({
      preheader: `Resumen ${frequency_label} de alertas`,
      title: `Resumen ${frequency_label} de alertas`,
      body,
    });
  }

  buildLocationLabelFromSlugs(
    municipalities_slugs: string[],
    province_slugs: string[],
  ): string {
    return formatLocationLabel(municipalities_slugs, province_slugs);
  }

  humanizeFuelSlug(fuel_type_slug: string): string {
    return humanizeSlug(fuel_type_slug);
  }

  formatTransmissionType(transmission_type: string): string {
    return formatTransmissionLabel(transmission_type);
  }

  private buildCtaBlock(label?: string, href?: string): string {
    if (!label || !href) {
      return "";
    }

    return `<p style="margin:28px 0 0;text-align:center;">
      <a href="${href}"
         style="display:inline-block;padding:14px 28px;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;font-size:14px;font-weight:600;text-decoration:none;color:#ffffff;background-color:#0153E8;border-radius:6px;">
        ${this.escapeHtml(label)}
      </a>
    </p>`;
  }

  private buildVehicleImageBlock(image_url: string | null): string {
    if (image_url) {
      return `<img src="${image_url}" alt="Imagen del vehículo" width="600" style="display:block;width:100%;max-width:600px;height:auto;border:0;outline:none;" />`;
    }

    return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#e5e7eb;">
      <tr>
        <td align="center" style="padding:48px 16px;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;font-size:14px;color:#6b7280;">
          Sin imagen
        </td>
      </tr>
    </table>`;
  }

  private render(template_name: string, variables: Record<string, string>): string {
    let html = this.loadTemplate(template_name);

    for (const [key, value] of Object.entries(variables)) {
      html = html.replaceAll(`{{${key}}}`, value);
    }

    return html;
  }

  private loadTemplate(template_name: string): string {
    const candidates = [
      path.join(__dirname, "templates", template_name),
      path.join(process.cwd(), "src/contexts/shared/mail/templates", template_name),
    ];

    for (const file_path of candidates) {
      if (existsSync(file_path)) {
        return readFileSync(file_path, "utf8");
      }
    }

    this.logger.error(`No se encontró ${template_name} en dist ni en src`);
    throw new Error(`Plantilla de correo no disponible: ${template_name}`);
  }
}
