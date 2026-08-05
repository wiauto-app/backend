import {
  Injectable,
  Logger,
  UnauthorizedException,
} from "@nestjs/common";

import { envs } from "@/src/common/envs";
import { getFrontendPath, FRONTEND_ROUTES } from "@/src/common/frontend-routes";
import { NewsletterService } from "@/src/contexts/newsletter/services/newsletter.service";
import { OutboundMailEnqueueService } from "@/src/contexts/shared/mail/outbound-mail-enqueue.service";

import { StrapiWebhookPayload } from "../dto/strapi-webhook-payload.dto";

@Injectable()
export class StrapiWebhookService {
  private readonly logger = new Logger(StrapiWebhookService.name);

  constructor(
    private readonly newsletter_service: NewsletterService,
    private readonly outbound_mail_enqueue_service: OutboundMailEnqueueService,
  ) {}

  assertWebhookSecret(header_secret: string | undefined): void {
    const expected = envs.STRAPI_WEBHOOK_SECRET?.trim();
    if (!expected) {
      return;
    }

    const provided = header_secret?.trim() ?? "";
    const normalized = provided
      .replace(/^Bearer\s+/i, "")
      .trim();

    if (!normalized || normalized !== expected) {
      throw new UnauthorizedException("Secreto de webhook Strapi inválido");
    }
  }

  async handleWebhook(payload: StrapiWebhookPayload): Promise<{ ok: true }> {
    const event = payload.event?.trim();
    const model = this.resolveModel(payload);

    if (event === "entry.publish" && model === "noticia") {
      await this.handleNoticiaPublish(payload);
    }

    return { ok: true };
  }

  private resolveModel(payload: StrapiWebhookPayload): string {
    const model = payload.model?.trim().toLowerCase();
    if (model) {
      return model;
    }

    const uid = payload.uid?.trim().toLowerCase() ?? "";
    if (uid.endsWith(".noticia") || uid.includes("noticia")) {
      return "noticia";
    }

    return "";
  }

  private async handleNoticiaPublish(
    payload: StrapiWebhookPayload,
  ): Promise<void> {
    const entry = payload.entry;
    if (!entry) {
      this.logger.warn("entry.publish noticia sin entry; se ignora");
      return;
    }

    const slug = entry.slug?.trim();
    const title = (entry.titulo ?? entry.title)?.trim();
    const summary = (
      entry.resumen ??
      entry.summary ??
      entry.descripcion_corta ??
      ""
    ).trim();
    const category_slug = entry.categoria_noticia?.slug?.trim().toLowerCase();
    const category_name = (
      entry.categoria_noticia?.nombre ??
      entry.categoria_noticia?.name ??
      category_slug ??
      "Noticias"
    ).trim();

    if (!slug || !title || !category_slug) {
      this.logger.warn(
        `entry.publish noticia incompleta (slug/title/categoría); se ignora`,
      );
      return;
    }

    const subscribers =
      await this.newsletter_service.findByCategorySlug(category_slug);

    if (subscribers.length === 0) {
      return;
    }

    const news_url = getFrontendPath(`${FRONTEND_ROUTES.NEWS}/${slug}`);

    for (const subscriber of subscribers) {
      if (subscriber.channel_email) {
        await this.outbound_mail_enqueue_service.enqueue_news_alert({
          to: subscriber.email,
          news_title: title,
          news_summary: summary,
          news_url,
          category_name,
        });
      }
      // channel_push / channel_in_app / channel_whatsapp / channel_sms:
      // prefs persistidas y filtradas; delivery en un paso posterior.
    }
  }
}
