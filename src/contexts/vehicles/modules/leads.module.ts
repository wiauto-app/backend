import { forwardRef, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { BullModule } from "@nestjs/bullmq";

import { TurnstileGuard } from "@/src/common/antispam/turnstile";
import { AlertsModule } from "@/src/contexts/alerts/alerts.module";
import { AuthModule } from "@/src/contexts/auth/auth.module";
import { BillingModule } from "@/src/contexts/billing/billing.module";
import { ChatModule } from "@/src/contexts/chat/modules/chat.module";
import { DealershipInvitationModule } from "@/src/contexts/dealership/modules/dealership-invitation.module";
import { FinancingModule } from "@/src/contexts/financing/financing.module";
import { ProfileModule } from "@/src/contexts/profiles/profile.module";
import { LeadAssistantModule } from "@/src/contexts/lead-assistant/lead-assistant.module";
import { ProactiveAlertsModule } from "@/src/contexts/proactive-alerts/proactive-alerts.module";

import { CreateCallMeLeadController } from "../api/v1/leads/create-call-me-lead.controller";
import { CreateFinancingLeadController } from "../api/v1/leads/create-financing-lead.controller";
import { CreateLeadController } from "../api/v1/leads/create-lead.controller";
import { FindSellerLeadsController } from "../api/v1/leads/find-seller-leads.controller";
import { LeadEntity } from "../entities/lead.entity";
import { TypeOrmLeadRepository } from "../repositories/typeorm.lead-repository";
import { LeadsService } from "../services/leads.service";
import { LeadScoringService } from "../services/lead-scoring.service";
import { LEAD_SCORING_QUEUE } from "../queues/lead-scoring.queue.constants";
import { LeadScoringEnqueueService } from "../queues/lead-scoring-enqueue.service";
import { LeadScoringProcessor } from "../queues/lead-scoring.processor";
import { VehiclesModule } from "../vehicles.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([LeadEntity]),
    BullModule.registerQueue({ name: LEAD_SCORING_QUEUE }),
    forwardRef(() => VehiclesModule),
    forwardRef(() => ChatModule),
    ProfileModule,
    forwardRef(() => FinancingModule),
    DealershipInvitationModule,
    forwardRef(() => AuthModule),
    forwardRef(() => AlertsModule),
    forwardRef(() => BillingModule),
    forwardRef(() => LeadAssistantModule),
    forwardRef(() => ProactiveAlertsModule),
  ],
  controllers: [
    CreateLeadController,
    CreateCallMeLeadController,
    CreateFinancingLeadController,
    FindSellerLeadsController,
  ],
  providers: [
    LeadsService,
    TypeOrmLeadRepository,
    LeadScoringService,
    LeadScoringEnqueueService,
    LeadScoringProcessor,
    TurnstileGuard,
  ],
  exports: [LeadsService, TypeOrmLeadRepository, LeadScoringService, LeadScoringEnqueueService],
})
export class LeadsModule {}
