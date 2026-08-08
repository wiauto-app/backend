import { existsSync, readFileSync } from "fs";
import path from "path";

import { Injectable, Logger } from "@nestjs/common";

import {
  FRONTEND_ROUTES,
  getFrontendPath,
  getFrontendUrl,
  getMailBrandLogoUrl,
  getMyListingsUrl,
} from "@/src/common/frontend-routes";

import {
  formatCurrencyEur,
  formatLocationLabel,
  formatMileage,
  formatTransmissionLabel,
  humanizeSlug,
} from "./mail-template.format";
import {
  MAIL_STATUS_THEMES,
  type MailStatusThemeKey,
  type MailVehicleCardPayload,
} from "./mail-vehicle-card";

export interface RenderBaseOptions {
  preheader: string;
  title: string;
  /** Si se informa, se usa HTML ya escapado/seguro en lugar de `title` escapado. */
  title_html?: string;
  body: string;
  cta_label?: string;
  cta_href?: string;
  footer_note?: string;
  share_url?: string;
  doc_title?: string;
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
    const share_url = options.share_url ?? getFrontendUrl("HOME");
    const share_encoded = encodeURIComponent(share_url);
    const title_html =
      options.title_html ?? this.escapeHtml(options.title);
    const doc_title = this.escapeHtml(options.doc_title ?? options.title);

    return this.render("base-email.html", {
      PREHEADER: this.escapeHtml(options.preheader),
      DOC_TITLE: doc_title,
      TITLE: title_html,
      BODY: options.body,
      CTA_BLOCK: cta_block,
      FOOTER_NOTE: footer_note,
      YEAR: year,
      HOME_URL: getFrontendUrl("HOME"),
      LOGO_URL: getMailBrandLogoUrl(),
      SHARE_URL: share_url,
      SHARE_FACEBOOK_URL: `https://www.facebook.com/sharer/sharer.php?u=${share_encoded}`,
      SHARE_WHATSAPP_URL: `https://wa.me/?text=${share_encoded}`,
      FOOTER_VEHICLES_URL: getFrontendUrl("VEHICLES"),
      FOOTER_FEATURED_URL: getFrontendPath(
        `${FRONTEND_ROUTES.VEHICLES}?is_featured=true`,
      ),
      FOOTER_CATEGORIES_URL: getFrontendUrl("VEHICLES"),
      FOOTER_CREATE_URL: getFrontendUrl("CREATE_VEHICLE"),
      FOOTER_PLANS_URL: getFrontendUrl("PLANS"),
      FOOTER_TIPS_URL: getFrontendUrl("SELL_VEHICLE"),
      FOOTER_ABOUT_URL: getFrontendUrl("ABOUT"),
      FOOTER_NEWS_URL: getFrontendUrl("NEWS"),
      FOOTER_CONTACT_URL: getFrontendUrl("CONTACT"),
      SOCIAL_FACEBOOK_URL: "https://www.facebook.com/",
      SOCIAL_INSTAGRAM_URL: "https://www.instagram.com/",
      SOCIAL_X_URL: "https://x.com/",
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

  renderUserWelcome(payload: { name?: string; home_url: string }): string {
    const greeting = payload.name
      ? `Hola ${this.escapeHtml(payload.name)},`
      : "Hola,";

    const body = `<p style="margin:0 0 24px;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;font-size:15px;line-height:1.6;color:#374151;">
        ${greeting}
      </p>
      <p style="margin:0 0 24px;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;font-size:15px;line-height:1.6;color:#374151;">
        Tu cuenta en WiAuto ya está lista. Explora vehículos, publica anuncios y gestiona tu perfil cuando quieras.
      </p>`;

    return this.renderBase({
      preheader: "Tu cuenta en WiAuto ya está activa.",
      title: "Bienvenido a WiAuto",
      body,
      cta_label: "Ir a WiAuto",
      cta_href: payload.home_url,
      footer_note: "Gracias por unirte a WiAuto.",
    });
  }

  renderNewLogin(payload: {
    ip_address?: string | null;
    user_agent?: string | null;
    occurred_at: string;
    audience: "platform" | "admin";
    account_url: string;
    recovery_url: string;
  }): string {
    const context_label =
      payload.audience === "admin"
        ? "el panel de administración de WiAuto"
        : "tu cuenta de WiAuto";
    const escaped_occurred_at = this.escapeHtml(
      new Date(payload.occurred_at).toLocaleString("es-ES", {
        dateStyle: "medium",
        timeStyle: "short",
      }),
    );
    const ip_row = payload.ip_address
      ? this.buildInfoRow("Dirección IP", this.escapeHtml(payload.ip_address))
      : "";
    const ua_row = payload.user_agent
      ? this.buildInfoRow("Dispositivo / navegador", this.escapeHtml(payload.user_agent), true)
      : "";

    const body = `<p style="margin:0 0 24px;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;font-size:15px;line-height:1.6;color:#374151;">
        Detectamos un nuevo inicio de sesión en ${context_label}.
      </p>
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border:1px solid #e5e7eb;border-radius:8px;margin:0 0 20px;">
        ${this.buildInfoRow("Fecha y hora", escaped_occurred_at)}
        ${ip_row}
        ${ua_row || this.buildInfoRow("Dispositivo / navegador", "No disponible", true)}
      </table>
      <p style="margin:0;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;font-size:15px;line-height:1.6;color:#374151;">
        Si no fuiste tú, cambia tu contraseña de inmediato.
      </p>`;

    return this.renderBase({
      preheader: `Nuevo inicio de sesión en ${context_label}.`,
      title: "Nuevo inicio de sesión",
      body,
      cta_label: "Restablecer contraseña",
      cta_href: payload.recovery_url,
      footer_note: `Si reconoces esta actividad, no hace falta que hagas nada. También puedes iniciar sesión en <a href="${payload.account_url}" style="color:#2563eb;text-decoration:underline;">WiAuto</a>.`,
    });
  }

  renderPasswordChanged(payload: {
    occurred_at: string;
    recovery_url: string;
  }): string {
    const escaped_occurred_at = this.escapeHtml(
      new Date(payload.occurred_at).toLocaleString("es-ES", {
        dateStyle: "medium",
        timeStyle: "short",
      }),
    );

    const body = `<p style="margin:0 0 24px;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;font-size:15px;line-height:1.6;color:#374151;">
        La contraseña de tu cuenta de WiAuto se actualizó correctamente.
      </p>
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border:1px solid #e5e7eb;border-radius:8px;margin:0 0 20px;">
        ${this.buildInfoRow("Fecha y hora", escaped_occurred_at, true)}
      </table>
      <p style="margin:0;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;font-size:15px;line-height:1.6;color:#374151;">
        Si no realizaste este cambio, restablece tu contraseña cuanto antes.
      </p>`;

    return this.renderBase({
      preheader: "Tu contraseña de WiAuto se ha actualizado.",
      title: "Contraseña actualizada",
      body,
      cta_label: "Restablecer contraseña",
      cta_href: payload.recovery_url,
      footer_note: "Si fuiste tú, puedes ignorar este mensaje.",
    });
  }

  renderAccountDeleted(payload: {
    occurred_at: string;
    home_url: string;
  }): string {
    const escaped_occurred_at = this.escapeHtml(
      new Date(payload.occurred_at).toLocaleString("es-ES", {
        dateStyle: "medium",
        timeStyle: "short",
      }),
    );

    const body = `<p style="margin:0 0 24px;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;font-size:15px;line-height:1.6;color:#374151;">
        Confirmamos que tu cuenta de WiAuto ha sido eliminada.
      </p>
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border:1px solid #e5e7eb;border-radius:8px;margin:0 0 20px;">
        ${this.buildInfoRow("Fecha y hora", escaped_occurred_at, true)}
      </table>
      <p style="margin:0;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;font-size:15px;line-height:1.6;color:#374151;">
        Ya no podrás iniciar sesión con este correo. Si crees que se trata de un error, contacta con soporte.
      </p>`;

    return this.renderBase({
      preheader: "Tu cuenta de WiAuto ha sido eliminada.",
      title: "Cuenta eliminada",
      body,
      cta_label: "Visitar WiAuto",
      cta_href: payload.home_url,
      footer_note: "Gracias por haber formado parte de WiAuto.",
    });
  }

  renderLeadNotification(payload: {
    vehicle_title: string;
    vehicle?: MailVehicleCardPayload | null;
    contacts_url?: string;
    lead: {
      type: string;
      name: string;
      email: string | null;
      phone: string | null;
      phone_code: string | null;
      message: string | null;
      callback_scheduled_at: string | null;
    };
  }): string {
    const is_call_me = payload.lead.type === "call_me";
    const escaped_title = this.escapeHtml(payload.vehicle_title);
    const escaped_name = this.escapeHtml(payload.lead.name);
    const escaped_message = payload.lead.message
      ? this.escapeHtml(payload.lead.message)
      : null;
    const phone_display =
      payload.lead.phone_code && payload.lead.phone
        ? `${this.escapeHtml(payload.lead.phone_code)} ${this.escapeHtml(payload.lead.phone)}`
        : "No indicado";

    const email_row = payload.lead.email
      ? this.buildInfoRow("Correo", this.escapeHtml(payload.lead.email))
      : "";

    const callback_row =
      is_call_me && payload.lead.callback_scheduled_at
        ? this.buildInfoRow(
            "Fecha preferida de llamada",
            this.escapeHtml(
              new Date(`${payload.lead.callback_scheduled_at}T00:00:00`).toLocaleDateString(
                "es-ES",
                { dateStyle: "long" },
              ),
            ),
          )
        : "";

    const message_row =
      !is_call_me && escaped_message
        ? this.buildInfoRow("Mensaje", escaped_message, true)
        : "";

    const intro_text = is_call_me
      ? `Recibiste una solicitud de llamada sobre tu anuncio <strong style="color:#111827;">${escaped_title}</strong>.`
      : `Recibiste una consulta sobre tu anuncio <strong style="color:#111827;">${escaped_title}</strong>.`;

    const vehicle_card = payload.vehicle
      ? this.buildVehicleCardHtml(payload.vehicle)
      : "";

    const lead_box = `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 20px;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
        <tr>
          <td style="background-color:#EFF6FF;padding:12px 16px;border-bottom:1px solid #e5e7eb;">
            <p style="margin:0;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;font-size:13px;font-weight:600;color:#0153E8;">
              ${is_call_me ? "Solicitud de llamada" : "Datos del interesado"}
            </p>
          </td>
        </tr>
        ${this.buildInfoRow("Nombre", escaped_name)}
        ${email_row}
        ${this.buildInfoRow("Teléfono", phone_display)}
        ${callback_row}
        ${message_row}
      </table>`;

    const body = `<p style="margin:0 0 20px;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;font-size:15px;line-height:1.6;color:#374151;">
        ${intro_text}
      </p>
      ${vehicle_card}
      ${lead_box}`;

    return this.renderBase({
      preheader: is_call_me
        ? `Solicitud de llamada sobre ${payload.vehicle_title}.`
        : `Nueva consulta sobre ${payload.vehicle_title}.`,
      title: is_call_me ? "Nueva solicitud de llamada" : "Nueva consulta recibida",
      body,
      ...(payload.contacts_url
        ? { cta_label: "Responder", cta_href: payload.contacts_url }
        : {}),
      footer_note: is_call_me
        ? "Contacta al interesado en la fecha indicada para no perder la oportunidad."
        : "Responde al interesado lo antes posible para no perder la oportunidad.",
      share_url: payload.vehicle?.detail_url,
    });
  }

  renderNewMessageNotification(payload: {
    sender_name: string;
    message_excerpt: string;
    messages_url: string;
    vehicle?: MailVehicleCardPayload | null;
  }): string {
    const escaped_sender = this.escapeHtml(payload.sender_name);
    const escaped_excerpt = this.escapeHtml(payload.message_excerpt);
    const vehicle_card = payload.vehicle
      ? this.buildVehicleCardHtml(payload.vehicle)
      : "";

    const message_box = `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 20px;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
        <tr>
          <td style="background-color:#F0FDF4;padding:12px 16px;border-bottom:1px solid #e5e7eb;">
            <p style="margin:0;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;font-size:13px;font-weight:600;color:#16A34A;">
              Nuevo mensaje de ${escaped_sender}
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 20px;">
            <p style="margin:0;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;font-size:15px;line-height:1.55;color:#111827;">
              ${escaped_excerpt}
            </p>
          </td>
        </tr>
      </table>`;

    const body = `<p style="margin:0 0 20px;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;font-size:15px;line-height:1.6;color:#374151;">
        Tienes un nuevo mensaje sobre tu anuncio.
      </p>
      ${vehicle_card}
      ${message_box}`;

    return this.renderBase({
      preheader: `${payload.sender_name}: ${payload.message_excerpt}`.slice(0, 120),
      title: "Nuevo mensaje",
      body,
      cta_label: "Ver mensaje",
      cta_href: payload.messages_url,
      footer_note: "Responde cuanto antes para no perder al interesado.",
      share_url: payload.vehicle?.detail_url,
    });
  }

  renderSellerStatusMail(payload: {
    theme: MailStatusThemeKey;
    vehicle: MailVehicleCardPayload;
    status_change_message?: string | null;
    expires_at_label?: string | null;
    cta_label: string;
    cta_href: string;
  }): string {
    const theme = MAIL_STATUS_THEMES[payload.theme];
    const title_html = this.buildColoredStatusTitle(theme.label, theme.color);
    const status_header = this.buildStatusIconHeader(theme);
    const vehicle_card = this.buildVehicleCardHtml(payload.vehicle);

    let extra_box = "";
    if (payload.theme === "rejected" && payload.status_change_message) {
      extra_box = this.buildRejectionBox(payload.status_change_message);
    } else if (
      (payload.theme === "expiry_soon" || payload.theme === "expired") &&
      payload.expires_at_label
    ) {
      extra_box = this.buildExpiryAlertBar(
        payload.theme,
        payload.expires_at_label,
      );
    }

    const intro = this.buildStatusIntro(payload.theme, payload.vehicle.title);

    const body = `${status_header}
      <p style="margin:0 0 20px;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;font-size:15px;line-height:1.6;color:#374151;">
        ${intro}
      </p>
      ${extra_box}
      ${vehicle_card}`;

    return this.renderBase({
      preheader: `${theme.label}: ${payload.vehicle.title}`,
      title: theme.label,
      title_html,
      body,
      cta_label: payload.cta_label,
      cta_href: payload.cta_href,
      footer_note:
        "Si tienes dudas, responde a este correo o contacta al soporte de WiAuto.",
      share_url: payload.vehicle.detail_url,
      doc_title: `${theme.label} — ${payload.vehicle.title}`,
    });
  }

  /**
   * @deprecated Preferir renderSellerStatusMail por tema.
   * Se mantiene por compatibilidad con jobs antiguos en cola.
   */
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
      ? this.buildRejectionBox(payload.status_change_message)
      : "";

    const body = `<p style="margin:0 0 24px;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;font-size:15px;line-height:1.6;color:#374151;">
        El anuncio <strong style="color:#111827;">${escaped_title}</strong> pasó de <strong style="color:#111827;">${escaped_previous}</strong> a <strong style="color:#111827;">${escaped_new}</strong>.
      </p>
      ${message_block}`;

    return this.renderBase({
      preheader: `Tu anuncio ${payload.vehicle_title} cambió de estado.`,
      title: "Tu anuncio cambió de estado",
      body,
      cta_label: "Mis anuncios",
      cta_href: getMyListingsUrl(),
      footer_note:
        "Si tienes dudas, responde a este correo o contacta al soporte de WiAuto.",
    });
  }

  renderPlanLeadRequestNotification(payload: {
    lead: {
      name: string;
      email: string;
      phone: string;
      cars_quantity: string;
      message: string | null;
    };
    created_at: string;
  }): string {
    const escaped_name = this.escapeHtml(payload.lead.name);
    const escaped_email = this.escapeHtml(payload.lead.email);
    const escaped_phone = this.escapeHtml(payload.lead.phone);
    const escaped_cars_quantity = this.escapeHtml(payload.lead.cars_quantity);
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
            <p style="margin:0;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;font-size:12px;color:#6b7280;">Cantidad de vehículos</p>
            <p style="margin:4px 0 0;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;font-size:15px;color:#111827;">${escaped_cars_quantity}</p>
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

  renderPlanLeadProposal(payload: {
    lead_name: string;
    plan_name: string;
    checkout_url: string;
    notes: string | null;
  }): string {
    const escaped_name = this.escapeHtml(payload.lead_name);
    const escaped_plan = this.escapeHtml(payload.plan_name);
    const escaped_url = this.escapeHtml(payload.checkout_url);
    const notes_html = payload.notes
      ? `<p style="margin:16px 0 0;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;font-size:15px;line-height:1.6;color:#374151;">${this.escapeHtml(payload.notes)}</p>`
      : "";

    const body = `<p style="margin:0 0 24px;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;font-size:15px;line-height:1.6;color:#374151;">
        Hola ${escaped_name}, hemos preparado una propuesta personalizada basada en el plan <strong>${escaped_plan}</strong>.
      </p>
      ${notes_html}
      <p style="margin:24px 0;">
        <a href="${escaped_url}" style="display:inline-block;padding:12px 20px;background:#111827;color:#ffffff;text-decoration:none;border-radius:8px;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;font-size:15px;">
          Revisar y contratar
        </a>
      </p>`;

    return this.renderBase({
      preheader: `Propuesta personalizada: ${payload.plan_name}`,
      title: "Tu propuesta de plan WiAuto",
      body,
      footer_note: "Si no solicitaste esta propuesta, puedes ignorar este correo.",
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

  renderSubscriptionPaymentReceived(payload: {
    plan_name: string;
    amount_label: string;
    is_renewal: boolean;
    invoice_url: string | null;
    portal_url: string | null;
  }): string {
    const escaped_plan = this.escapeHtml(payload.plan_name);
    const escaped_amount = this.escapeHtml(payload.amount_label);
    const title = payload.is_renewal
      ? "Renovación confirmada"
      : "Pago recibido";
    const lead = payload.is_renewal
      ? `Hemos renovado tu plan <strong style="color:#111827;">${escaped_plan}</strong>.`
      : `Hemos recibido el pago de tu plan <strong style="color:#111827;">${escaped_plan}</strong>.`;

    const invoice_block = payload.invoice_url
      ? `<p style="margin:0 0 24px;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;font-size:15px;line-height:1.6;color:#374151;">
          Puedes consultar o descargar tu factura desde el enlace del botón.
        </p>`
      : "";

    const body = `<p style="margin:0 0 24px;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;font-size:15px;line-height:1.6;color:#374151;">
        ${lead}
      </p>
      <p style="margin:0 0 24px;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;font-size:15px;line-height:1.6;color:#374151;">
        Importe: <strong style="color:#111827;">${escaped_amount}</strong>
      </p>
      ${invoice_block}`;

    const cta_href = payload.invoice_url ?? payload.portal_url;
    const cta_label = payload.invoice_url
      ? "Ver factura"
      : "Gestionar suscripción";

    return this.renderBase({
      preheader: payload.is_renewal
        ? `Renovación de ${payload.plan_name} confirmada.`
        : `Pago de ${payload.plan_name} recibido.`,
      title,
      body,
      ...(cta_href ? { cta_label, cta_href } : {}),
      footer_note: "Gracias por confiar en WiAuto PRO.",
    });
  }

  renderSubscriptionPlanChanged(payload: {
    previous_plan_name: string;
    new_plan_name: string;
    portal_url: string | null;
  }): string {
    const body = `<p style="margin:0 0 24px;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;font-size:15px;line-height:1.6;color:#374151;">
        Tu suscripción ha cambiado de
        <strong style="color:#111827;">${this.escapeHtml(payload.previous_plan_name)}</strong>
        a
        <strong style="color:#111827;">${this.escapeHtml(payload.new_plan_name)}</strong>.
      </p>
      <p style="margin:0 0 24px;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;font-size:15px;line-height:1.6;color:#374151;">
        Los cupos y ventajas del nuevo plan ya están activos en tu cuenta.
      </p>`;

    return this.renderBase({
      preheader: `Cambio a ${payload.new_plan_name}.`,
      title: "Cambio de plan",
      body,
      ...(payload.portal_url
        ? {
            cta_label: "Gestionar suscripción",
            cta_href: payload.portal_url,
          }
        : {}),
      footer_note: "Si no reconoces este cambio, revisa tu portal de facturación.",
    });
  }

  renderListingLimitReached(payload: {
    max_listings: number;
    listings_used: number;
    plan_name: string | null;
    plans_url: string;
  }): string {
    const plan_line = payload.plan_name
      ? ` de tu plan <strong style="color:#111827;">${this.escapeHtml(payload.plan_name)}</strong>`
      : "";

    const body = `<p style="margin:0 0 24px;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;font-size:15px;line-height:1.6;color:#374151;">
        Has alcanzado el límite de anuncios activos${plan_line}
        (${payload.listings_used}/${payload.max_listings}).
      </p>
      <p style="margin:0 0 24px;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;font-size:15px;line-height:1.6;color:#374151;">
        Archiva un anuncio o mejora tu plan para publicar más vehículos.
      </p>`;

    return this.renderBase({
      preheader: "Has llegado al límite de anuncios activos.",
      title: "Límite de anuncios",
      body,
      cta_label: "Ver planes",
      cta_href: payload.plans_url,
      footer_note: "El cupo se comparte entre todos los miembros del concesionario si aplica.",
    });
  }

  renderFeaturedPurchased(payload: {
    vehicle_title: string;
    featured_expires_at_label: string;
    vehicle_edit_url: string;
  }): string {
    const body = `<p style="margin:0 0 24px;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;font-size:15px;line-height:1.6;color:#374151;">
        Tu anuncio <strong style="color:#111827;">${this.escapeHtml(payload.vehicle_title)}</strong>
        ya está destacado.
      </p>
      <p style="margin:0 0 24px;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;font-size:15px;line-height:1.6;color:#374151;">
        El destacado estará activo hasta el
        <strong style="color:#111827;">${this.escapeHtml(payload.featured_expires_at_label)}</strong>.
      </p>`;

    return this.renderBase({
      preheader: `Destacado activo: ${payload.vehicle_title}.`,
      title: "Anuncio destacado",
      body,
      cta_label: "Ver anuncio",
      cta_href: payload.vehicle_edit_url,
      footer_note: "Puedes renovar el destacado cuando expire.",
    });
  }

  renderFeaturedExpired(payload: {
    vehicle_title: string;
    vehicle_edit_url: string;
  }): string {
    const body = `<p style="margin:0 0 24px;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;font-size:15px;line-height:1.6;color:#374151;">
        El destacado de
        <strong style="color:#111827;">${this.escapeHtml(payload.vehicle_title)}</strong>
        ha finalizado.
      </p>
      <p style="margin:0 0 24px;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;font-size:15px;line-height:1.6;color:#374151;">
        Destácalo de nuevo para seguir ganando visibilidad.
      </p>`;

    return this.renderBase({
      preheader: `El destacado de ${payload.vehicle_title} ha caducado.`,
      title: "Destacado finalizado",
      body,
      cta_label: "Destacar de nuevo",
      cta_href: payload.vehicle_edit_url,
      footer_note: "Los anuncios sin destacado siguen publicados con normalidad.",
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

  renderNewsAlert(payload: {
    news_title: string;
    news_summary: string;
    news_url: string;
    category_name: string;
  }): string {
    const summary = payload.news_summary.trim();
    const body = `
      <p style="margin:0 0 8px;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;font-size:13px;color:#6b7280;">
        Categoría: <strong>${this.escapeHtml(payload.category_name)}</strong>
      </p>
      ${
        summary
          ? `<p style="margin:0 0 16px;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;font-size:15px;line-height:1.6;color:#374151;">
        ${this.escapeHtml(summary)}
      </p>`
          : ""
      }`;

    return this.renderBase({
      preheader: summary || payload.news_title,
      title: payload.news_title,
      body,
      cta_label: "Leer noticia",
      cta_href: payload.news_url,
      footer_note:
        "Recibes este correo porque estás suscrito a las alertas de noticias de WiAuto. Puedes gestionar tus preferencias en Configuración.",
    });
  }

  renderAppraisalRequestNotification(payload: {
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
  }): string {
    const escaped_vehicle_label = this.escapeHtml(payload.appraisal.vehicle_label);
    const escaped_name = this.escapeHtml(payload.appraisal.name);
    const escaped_email = this.escapeHtml(payload.appraisal.email);
    const escaped_phone = this.escapeHtml(
      `${payload.appraisal.phone_code} ${payload.appraisal.phone}`,
    );
    const escaped_created_at = this.escapeHtml(
      new Date(payload.created_at).toLocaleString("es-ES", {
        dateStyle: "medium",
        timeStyle: "short",
      }),
    );

    const address_row = payload.appraisal.address
      ? `<tr>
          <td style="padding:16px 20px;border-bottom:1px solid #e5e7eb;">
            <p style="margin:0;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;font-size:12px;color:#6b7280;">Ubicación</p>
            <p style="margin:4px 0 0;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;font-size:15px;color:#111827;white-space:pre-line;">${this.escapeHtml(payload.appraisal.address)}</p>
          </td>
        </tr>`
      : "";

    const body = `<p style="margin:0 0 24px;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;font-size:15px;line-height:1.6;color:#374151;">
        Recibiste una nueva solicitud de tasación para un <strong style="color:#111827;">${escaped_vehicle_label}</strong>.
      </p>
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border:1px solid #e5e7eb;border-radius:8px;">
        <tr>
          <td style="padding:16px 20px;border-bottom:1px solid #e5e7eb;">
            <p style="margin:0;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;font-size:12px;color:#6b7280;">Kilometraje</p>
            <p style="margin:4px 0 0;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;font-size:15px;color:#111827;">${formatMileage(payload.appraisal.mileage)}</p>
          </td>
        </tr>
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
        ${address_row}
        <tr>
          <td style="padding:16px 20px;">
            <p style="margin:0;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;font-size:12px;color:#6b7280;">Fecha</p>
            <p style="margin:4px 0 0;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;font-size:15px;color:#111827;">${escaped_created_at}</p>
          </td>
        </tr>
      </table>`;

    return this.renderBase({
      preheader: `Nueva solicitud de tasación de ${payload.appraisal.vehicle_label}.`,
      title: "Nueva solicitud de tasación",
      body,
      footer_note: "Revisa la solicitud en el panel de administración y responde con un rango estimado.",
    });
  }

  renderAppraisalRequestAnswered(payload: {
    name: string;
    vehicle_label: string;
    estimated_price_min: number;
    estimated_price_max: number;
    admin_note: string | null;
  }): string {
    const escaped_name = this.escapeHtml(payload.name);
    const escaped_vehicle_label = this.escapeHtml(payload.vehicle_label);
    const note_block = payload.admin_note
      ? `<p style="margin:0 0 24px;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;font-size:15px;line-height:1.6;color:#374151;">
            <strong style="color:#111827;">Nota del equipo:</strong><br />${this.escapeHtml(payload.admin_note)}
          </p>`
      : "";

    const body = `<p style="margin:0 0 24px;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;font-size:15px;line-height:1.6;color:#374151;">
        Hola ${escaped_name}, ya revisamos los datos de tu <strong style="color:#111827;">${escaped_vehicle_label}</strong>.
      </p>
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border:1px solid #e5e7eb;border-radius:8px;margin:0 0 24px;">
        <tr>
          <td style="padding:16px 20px;">
            <p style="margin:0;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;font-size:12px;color:#6b7280;">Rango estimado</p>
            <p style="margin:4px 0 0;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;font-size:18px;font-weight:600;color:#111827;">${formatCurrencyEur(payload.estimated_price_min)} – ${formatCurrencyEur(payload.estimated_price_max)}</p>
          </td>
        </tr>
      </table>
      ${note_block}
      <p style="margin:0;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;font-size:14px;line-height:1.6;color:#6b7280;">
        Este rango es orientativo y no constituye un compromiso de compra. Si quieres avanzar, contáctanos para coordinar los siguientes pasos.
      </p>`;

    return this.renderBase({
      preheader: `Tenemos una estimación para tu ${payload.vehicle_label}.`,
      title: "Estimación de tu tasación",
      body,
      footer_note: "Gracias por confiar en WiAuto para tasar tu vehículo.",
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

  private buildColoredStatusTitle(label: string, color: string): string {
    return `Tu anuncio: <span style="color:${color};">${this.escapeHtml(label)}</span>`;
  }

  private buildStatusIconHeader(theme: {
    color: string;
    label: string;
    icon: string;
  }): string {
    return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 20px;">
      <tr>
        <td style="width:40px;height:40px;border-radius:20px;background-color:${theme.color};text-align:center;vertical-align:middle;">
          <span style="font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;font-size:18px;font-weight:700;color:#ffffff;line-height:40px;">${this.escapeHtml(theme.icon)}</span>
        </td>
        <td style="padding-left:12px;vertical-align:middle;">
          <p style="margin:0;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;font-size:14px;font-weight:600;color:${theme.color};">
            ${this.escapeHtml(theme.label)}
          </p>
        </td>
      </tr>
    </table>`;
  }

  private buildStatusIntro(theme: MailStatusThemeKey, vehicle_title: string): string {
    const title = `<strong style="color:#111827;">${this.escapeHtml(vehicle_title)}</strong>`;
    switch (theme) {
      case "published":
        return `Tu anuncio ${title} se publicó correctamente y está pendiente de revisión.`;
      case "approved":
        return `¡Buenas noticias! Tu anuncio ${title} fue aprobado y ya es visible para compradores.`;
      case "rejected":
        return `Tu anuncio ${title} fue rechazado. Revisa el motivo y edítalo para volver a publicarlo.`;
      case "deactivated":
        return `Tu anuncio ${title} quedó desactivado y ya no es visible en el listado.`;
      case "sold":
        return `Marcado como vendido: ${title}. ¡Enhorabuena por la venta!`;
      case "archived":
        return `Tu anuncio ${title} fue archivado.`;
      case "expiry_soon":
        return `Tu anuncio ${title} caduca en breve. Renúevalo para seguir recibiendo contactos.`;
      case "expired":
        return `Tu anuncio ${title} ha caducado y dejó de estar activo.`;
      default:
        return `Actualización sobre tu anuncio ${title}.`;
    }
  }

  private buildRejectionBox(message: string): string {
    return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 20px;border:1px solid #FECACA;border-radius:8px;background-color:#FEF2F2;">
      <tr>
        <td style="padding:16px 20px;">
          <p style="margin:0 0 6px;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;font-size:12px;font-weight:600;color:#DC2626;">
            Motivo del rechazo
          </p>
          <p style="margin:0;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;font-size:15px;line-height:1.55;color:#7F1D1D;">
            ${this.escapeHtml(message)}
          </p>
        </td>
      </tr>
    </table>`;
  }

  private buildExpiryAlertBar(
    theme: "expiry_soon" | "expired",
    expires_at_label: string,
  ): string {
    const is_soon = theme === "expiry_soon";
    const bg = is_soon ? "#FFF7ED" : "#FEF2F2";
    const border = is_soon ? "#FDBA74" : "#FECACA";
    const color = is_soon ? "#EA580C" : "#DC2626";
    const label = is_soon ? "Caduca el" : "Caducó el";

    return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 20px;border:1px solid ${border};border-radius:8px;background-color:${bg};">
      <tr>
        <td style="padding:14px 18px;">
          <p style="margin:0;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;font-size:14px;font-weight:600;color:${color};">
            ${label} ${this.escapeHtml(expires_at_label)}
          </p>
        </td>
      </tr>
    </table>`;
  }

  private buildVehicleCardHtml(vehicle: MailVehicleCardPayload): string {
    const price_label =
      vehicle.price !== null && vehicle.price !== undefined
        ? formatCurrencyEur(vehicle.price)
        : "Precio a consultar";
    const year_label =
      vehicle.year !== null && vehicle.year !== undefined
        ? String(vehicle.year)
        : "—";
    const mileage_label =
      vehicle.mileage !== null && vehicle.mileage !== undefined
        ? formatMileage(vehicle.mileage)
        : "—";

    return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 20px;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
      <tr>
        <td style="padding:0;vertical-align:top;" width="180">
          ${this.buildVehicleImageBlock(vehicle.image_url)}
        </td>
        <td style="padding:16px 18px;vertical-align:top;">
          <p style="margin:0 0 8px;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;font-size:16px;font-weight:600;line-height:1.35;color:#111827;">
            ${this.escapeHtml(vehicle.title)}
          </p>
          <p style="margin:0 0 12px;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;font-size:18px;font-weight:700;line-height:1.3;color:#0153E8;">
            ${price_label}
          </p>
          <p style="margin:0 0 4px;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;font-size:13px;color:#6b7280;">
            <strong style="color:#374151;">Año:</strong> ${year_label}
          </p>
          <p style="margin:0 0 4px;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;font-size:13px;color:#6b7280;">
            <strong style="color:#374151;">Kilometraje:</strong> ${mileage_label}
          </p>
          <p style="margin:0 0 4px;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;font-size:13px;color:#6b7280;">
            <strong style="color:#374151;">Combustible:</strong> ${this.escapeHtml(vehicle.fuel_label)}
          </p>
          <p style="margin:0 0 4px;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;font-size:13px;color:#6b7280;">
            <strong style="color:#374151;">Transmisión:</strong> ${this.escapeHtml(vehicle.transmission_label)}
          </p>
          <p style="margin:0;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;font-size:13px;color:#6b7280;">
            <strong style="color:#374151;">Ubicación:</strong> ${this.escapeHtml(vehicle.location_label)}
          </p>
        </td>
      </tr>
    </table>`;
  }

  private buildInfoRow(
    label: string,
    value_html: string,
    last = false,
  ): string {
    const border = last ? "" : "border-bottom:1px solid #e5e7eb;";
    return `<tr>
      <td style="padding:16px 20px;${border}">
        <p style="margin:0;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;font-size:12px;color:#6b7280;">${this.escapeHtml(label)}</p>
        <p style="margin:4px 0 0;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;font-size:15px;line-height:1.5;color:#111827;">${value_html}</p>
      </td>
    </tr>`;
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
