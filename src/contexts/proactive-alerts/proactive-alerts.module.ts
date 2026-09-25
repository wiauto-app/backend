import { Module, forwardRef } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { BullModule } from "@nestjs/bullmq";

import { AlertsModule } from "@/src/contexts/alerts/alerts.module";
import { AuthModule } from "@/src/contexts/auth/auth.module";
import { BillingModule } from "@/src/contexts/billing/billing.module";
import { VehiclesModule } from "@/src/contexts/vehicles/vehicles.module";
import { LeadEntity } from "@/src/contexts/vehicles/entities/lead.entity";
import { VehicleEntity } from "@/src/contexts/vehicles/entities/vehicle.entity";
import { TypeOrmLeadRepository } from "@/src/contexts/vehicles/repositories/typeorm.lead-repository";

import { GetProactiveAlertSettingsController } from "./api/get-proactive-alert-settings/get-proactive-alert-settings.controller";
import { PatchProactiveAlertSettingsController } from "./api/patch-proactive-alert-settings/patch-proactive-alert-settings.controller";
import { ProactiveAlertLogEntity } from "./entities/proactive-alert-log.entity";
import { ProactiveAlertSettingsEntity } from "./entities/proactive-alert-settings.entity";
import { PROACTIVE_ALERTS_QUEUE } from "./queues/proactive-alerts.queue.constants";
import { ProactiveAlertEnqueueService } from "./queues/proactive-alerts-enqueue.service";
import { ProactiveAlertsBootstrapService } from "./queues/proactive-alerts-bootstrap.service";
import { ProactiveAlertsProcessor } from "./queues/proactive-alerts.processor";
import { ProactiveAlertDispatchService } from "./services/proactive-alert-dispatch.service";
import { ProactiveAlertEvaluatorService } from "./services/proactive-alert-evaluator.service";
import { ProactiveAlertEventService } from "./services/proactive-alert-event.service";
import { ProactiveAlertSettingsService } from "./services/proactive-alert-settings.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ProactiveAlertSettingsEntity,
      ProactiveAlertLogEntity,
      VehicleEntity,
      LeadEntity,
    ]),
    BullModule.registerQueue({ name: PROACTIVE_ALERTS_QUEUE }),
    forwardRef(() => AuthModule),
    forwardRef(() => BillingModule),
    forwardRef(() => AlertsModule),
    forwardRef(() => VehiclesModule),
  ],
  controllers: [
    GetProactiveAlertSettingsController,
    PatchProactiveAlertSettingsController,
  ],
  providers: [
    ProactiveAlertSettingsService,
    ProactiveAlertDispatchService,
    ProactiveAlertEvaluatorService,
    ProactiveAlertEventService,
    ProactiveAlertEnqueueService,
    ProactiveAlertsProcessor,
    ProactiveAlertsBootstrapService,
    TypeOrmLeadRepository,
  ],
  exports: [ProactiveAlertEventService, ProactiveAlertEnqueueService],
})
export class ProactiveAlertsModule {}
