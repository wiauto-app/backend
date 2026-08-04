import { Module } from "@nestjs/common";
import { WebhookController } from "./api/webhook.controller";
import { WebhookService } from "./services/webhook.service";


@Module({
  controllers: [WebhookController],
  providers: [WebhookService],
  exports: [WebhookService],
})
export class WebhookModule {}