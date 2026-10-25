import { Body, Controller, Post } from "@nestjs/common";

import {
  Honeypot,
  type HoneypotRequestBody,
  honeypotBodyString,
} from "@/src/common/antispam/honeypot";
import { OptInThrottle } from "@/src/common/antispam/opt-in-throttle.decorator";
import { THROTTLER_NAME } from "@/src/common/antispam/throttler-names";
import { envs } from "@/src/common/envs";
import { uuidv4 } from "@/src/contexts/shared/uuid-generator/uuid-generator";

import { DEFAULT_NEWS_CATEGORY_SLUGS } from "../../../constants/default-news-category-slugs";
import { SubscribeNewsletterHttpDto } from "../../../dto/subscribe-newsletter.http-dto";
import { NewsletterService } from "../../../services/newsletter.service";
import { V1_NEWSLETTER } from "../../route.constants";

/** Misma forma que una `NewsletterSubscriptionEntity` nueva, sin persistir. */
const fakeNewsletterSubscriptionResponse = (body: HoneypotRequestBody) => {
  const now = new Date();
  return {
    id: uuidv4(),
    email: (honeypotBodyString(body, "email") ?? "").trim().toLowerCase(),
    profile_id: null,
    enabled_category_slugs: [...DEFAULT_NEWS_CATEGORY_SLUGS],
    channel_email: true,
    channel_push: true,
    channel_in_app: true,
    channel_whatsapp: false,
    channel_sms: false,
    created_at: now,
    updated_at: now,
  };
};

@Controller(V1_NEWSLETTER)
export class SubscribeNewsletterController {
  constructor(private readonly newsletter_service: NewsletterService) {}

  @Post("subscribe")
  @OptInThrottle(THROTTLER_NAME.NEWSLETTER_SUBSCRIBE, {
    limit: envs.NEWSLETTER_SUBSCRIBE_THROTTLE_LIMIT,
    ttl: envs.NEWSLETTER_SUBSCRIBE_THROTTLE_TTL_MS,
  })
  @Honeypot(fakeNewsletterSubscriptionResponse)
  subscribe(@Body() body: SubscribeNewsletterHttpDto) {
    return this.newsletter_service.subscribe(body);
  }
}
