import { BadRequestException, Controller, Post, Req } from "@nestjs/common";
import type { RawBodyRequest } from "@nestjs/common";
import type { Request } from "express";

import { StripeWebhookService } from "../../../services/stripe-webhook.service";
import { V1_BILLING_WEBHOOKS_STRIPE } from "../../route.constants";

@Controller(V1_BILLING_WEBHOOKS_STRIPE)
export class StripeWebhookController {
  constructor(private readonly webhook_service: StripeWebhookService) {}

  @Post()
  run(@Req() req: RawBodyRequest<Request>) {
    const signature = req.headers["stripe-signature"];
    const payload = req.rawBody;

    if (!payload?.length) {
      throw new BadRequestException(
        "Webhook sin raw body. Verifica rawBody: true en main.ts y que Stripe envíe el payload sin transformar.",
      );
    }

    return this.webhook_service.handle(
      payload,
      typeof signature === "string" ? signature : undefined,
    );
  }
}
