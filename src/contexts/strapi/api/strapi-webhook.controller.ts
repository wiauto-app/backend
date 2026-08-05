import { Body, Controller, Headers, Post } from "@nestjs/common";

import { StrapiWebhookPayload } from "../dto/strapi-webhook-payload.dto";
import { StrapiWebhookService } from "../services/strapi-webhook.service";

@Controller("strapi/webhook")
export class StrapiWebhookController {
  constructor(private readonly strapi_webhook_service: StrapiWebhookService) {}

  @Post()
  async handleWebhook(
    @Body() payload: StrapiWebhookPayload,
    @Headers("x-strapi-webhook-secret") secret_header?: string,
    @Headers("authorization") authorization?: string,
  ) {
    this.strapi_webhook_service.assertWebhookSecret(
      secret_header ?? authorization,
    );
    return this.strapi_webhook_service.handleWebhook(payload ?? {});
  }
}
