import { forwardRef, Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";
import { TypeOrmModule } from "@nestjs/typeorm";

import { AuthModule } from "@/src/contexts/auth/auth.module";
import { ProfileModule } from "@/src/contexts/profiles/profile.module";
import { VehiclesModule } from "@/src/contexts/vehicles/vehicles.module";

import { CreateAlertFromVehicleUseCase } from "./application/create-alert-from-vehicle-use-case/create-alert-from-vehicle.use-case";
import { CreateAlertUseCase } from "./application/create-alert-use-case/create-alert.use-case";
import { DeleteAlertUseCase } from "./application/delete-alert-use-case/delete-alert.use-case";
import { FindAllAlertsUseCase } from "./application/find-all-alerts-use-case/find-all-alerts.use-case";
import { FindOneAlertUseCase } from "./application/find-one-alert-use-case/find-one-alert.use-case";
import { UpdateAlertUseCase } from "./application/update-alert-use-case/update-alert.use-case";
import { MatchVehicleAlertsUseCase } from "./application/match-vehicle-alerts-use-case/match-vehicle-alerts.use-case";
import { AlertRepository } from "./domain/alert.repository";
import { AlertNotificationDispatcher } from "./domain/ports/alert-notification.port";
import { AlertEntity } from "./infrastructure/entities/alert.entity";
import { CreateAlertController } from "./infrastructure/http-api/v1/create-alert/create-alert.controller";
import { CreateAlertFromVehicleController } from "./infrastructure/http-api/v1/create-alert-from-vehicle/create-alert-from-vehicle.controller";
import { DeleteAlertController } from "./infrastructure/http-api/v1/delete-alert/delete-alert.controller";
import { FindAllAlertsController } from "./infrastructure/http-api/v1/find-all-alerts/find-all-alerts.controller";
import { FindOneAlertController } from "./infrastructure/http-api/v1/find-one-alert/find-one-alert.controller";
import { UpdateAlertController } from "./infrastructure/http-api/v1/update-alert/update-alert.controller";
import { TypeOrmAlertRepository } from "./infrastructure/persistance/typeorm.alert-repository";
import { ALERT_PROCESSING_QUEUE } from "./infrastructure/queues/alert-processing.queue.constants";
import { AlertProcessingEnqueueService } from "./infrastructure/queues/alert-processing-enqueue.service";
import { AlertProcessingProcessor } from "./infrastructure/queues/alert-processing.processor";
import { AlertEmailNotificationService } from "./infrastructure/services/alert-email-notification.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([AlertEntity]),
    BullModule.registerQueue({ name: ALERT_PROCESSING_QUEUE }),
    AuthModule,
    ProfileModule,
    forwardRef(() => VehiclesModule),
  ],
  controllers: [
    CreateAlertController,
    CreateAlertFromVehicleController,
    FindAllAlertsController,
    FindOneAlertController,
    UpdateAlertController,
    DeleteAlertController,
  ],
  providers: [
    CreateAlertUseCase,
    CreateAlertFromVehicleUseCase,
    FindAllAlertsUseCase,
    FindOneAlertUseCase,
    UpdateAlertUseCase,
    DeleteAlertUseCase,
    MatchVehicleAlertsUseCase,
    AlertProcessingEnqueueService,
    AlertProcessingProcessor,
    AlertEmailNotificationService,
    TypeOrmAlertRepository,
    {
      provide: AlertRepository,
      useExisting: TypeOrmAlertRepository,
    },
    {
      provide: AlertNotificationDispatcher,
      useExisting: AlertEmailNotificationService,
    },
  ],
  exports: [AlertRepository, AlertProcessingEnqueueService],
})
export class AlertsModule {}
