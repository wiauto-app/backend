import { Module } from "@nestjs/common";

import { NewsletterModule } from "@/src/contexts/newsletter/newsletter.module";

import { StrapiWebhookController } from "./api/strapi-webhook.controller";
import { StrapiWebhookService } from "./services/strapi-webhook.service";

@Module({
  imports: [NewsletterModule],
  controllers: [StrapiWebhookController],
  providers: [StrapiWebhookService],
  exports: [StrapiWebhookService],
})
export class StrapiWebhookModule {}
