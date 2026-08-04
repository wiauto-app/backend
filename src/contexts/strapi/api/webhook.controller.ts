import { Body, Controller, Post } from "@nestjs/common";
import { WebhookService } from "../services/webhook.service";


@Controller('strapi/webhook')
export class WebhookController {
  constructor(private readonly webhookService: WebhookService) {}

  @Post()
  async sendWebhook(@Body() webhook: any) {
    return this.webhookService.sendWebhook(webhook);
  }
}