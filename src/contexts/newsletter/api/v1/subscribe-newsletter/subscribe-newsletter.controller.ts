import { Body, Controller, Post } from "@nestjs/common";

import { SubscribeNewsletterHttpDto } from "../../../dto/subscribe-newsletter.http-dto";
import { NewsletterService } from "../../../services/newsletter.service";
import { V1_NEWSLETTER } from "../../route.constants";

@Controller(V1_NEWSLETTER)
export class SubscribeNewsletterController {
  constructor(private readonly newsletter_service: NewsletterService) {}

  @Post("subscribe")
  subscribe(@Body() body: SubscribeNewsletterHttpDto) {
    return this.newsletter_service.subscribe(body);
  }
}
