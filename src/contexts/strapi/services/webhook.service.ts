import { Injectable } from "@nestjs/common";


@Injectable()
export class WebhookService {

  async sendWebhook(webhook: any) {
    console.log("webhook", webhook);
    return{
      webhook: webhook,
    }
  }
}