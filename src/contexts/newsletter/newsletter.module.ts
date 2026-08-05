import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { User } from "@/src/contexts/users/entities/user.entity";

import { MeNewsletterController } from "./api/v1/me-newsletter/me-newsletter.controller";
import { SubscribeNewsletterController } from "./api/v1/subscribe-newsletter/subscribe-newsletter.controller";
import { NewsletterSubscriptionEntity } from "./entities/newsletter-subscription.entity";
import { NewsletterService } from "./services/newsletter.service";

@Module({
  imports: [TypeOrmModule.forFeature([NewsletterSubscriptionEntity, User])],
  controllers: [SubscribeNewsletterController, MeNewsletterController],
  providers: [NewsletterService],
  exports: [NewsletterService],
})
export class NewsletterModule {}
