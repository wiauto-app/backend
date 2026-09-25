import { Module, forwardRef } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { BullModule } from "@nestjs/bullmq";

import { AlertsModule } from "@/src/contexts/alerts/alerts.module";
import { BillingModule } from "@/src/contexts/billing/billing.module";
import { ChatModule } from "@/src/contexts/chat/modules/chat.module";
import { ProfileModule } from "@/src/contexts/profiles/profile.module";
import { VehiclesModule } from "@/src/contexts/vehicles/vehicles.module";
import { LeadsModule } from "@/src/contexts/vehicles/modules/leads.module";
import { SubscriptionEntity } from "@/src/contexts/billing/entities/subscription.entity";
import { LeadEntity } from "@/src/contexts/vehicles/entities/lead.entity";
import { MailModule } from "@/src/contexts/shared/mail/mail.module";

import { GetLeadAssistantSettingsController } from "./api/get-lead-assistant-settings/get-lead-assistant-settings.controller";
import { PatchLeadAssistantSettingsController } from "./api/patch-lead-assistant-settings/patch-lead-assistant-settings.controller";
import { LeadAssistantQuotaNoticeEntity } from "./entities/lead-assistant-quota-notice.entity";
import { LeadAssistantSettingsEntity } from "./entities/lead-assistant-settings.entity";
import { LEAD_ASSISTANT_REPLY_QUEUE } from "./queues/lead-assistant-reply.queue.constants";
import { LeadAssistantReplyEnqueueService } from "./queues/lead-assistant-reply-enqueue.service";
import { LeadAssistantReplyProcessor } from "./queues/lead-assistant-reply.processor";
import { LeadAssistantReplyGenerationService } from "./services/lead-assistant-reply-generation.service";
import { LeadAssistantReplyJobService } from "./services/lead-assistant-reply-job.service";
import { LeadAssistantSettingsService } from "./services/lead-assistant-settings.service";
import { LeadAssistantChatHookService } from "./services/lead-assistant-chat-hook.service";
import { LeadAssistantLeadHookService } from "./services/lead-assistant-lead-hook.service";
import { ProfileEntity } from "../profiles/entities/profile.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      LeadAssistantSettingsEntity,
      LeadAssistantQuotaNoticeEntity,
      SubscriptionEntity,
      ProfileEntity,
      LeadEntity,
    ]),
    BullModule.registerQueue({ name: LEAD_ASSISTANT_REPLY_QUEUE }),
    MailModule,
    forwardRef(() => BillingModule),
    ProfileModule,
    forwardRef(() => ChatModule),
    forwardRef(() => VehiclesModule),
    forwardRef(() => LeadsModule),
    forwardRef(() => AlertsModule),
  ],
  controllers: [
    GetLeadAssistantSettingsController,
    PatchLeadAssistantSettingsController,
  ],
  providers: [
    LeadAssistantSettingsService,
    LeadAssistantReplyGenerationService,
    LeadAssistantReplyJobService,
    LeadAssistantReplyEnqueueService,
    LeadAssistantReplyProcessor,
    LeadAssistantChatHookService,
    LeadAssistantLeadHookService,
  ],
  exports: [
    LeadAssistantReplyEnqueueService,
    LeadAssistantSettingsService,
    LeadAssistantChatHookService,
    LeadAssistantLeadHookService,
  ],
})
export class LeadAssistantModule {}
