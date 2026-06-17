import { forwardRef, Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";
import { TypeOrmModule } from "@nestjs/typeorm";

import { AuthModule } from "@/src/contexts/auth/auth.module";
import { ProfileModule } from "@/src/contexts/profiles/profile.module";
import { VehiclesModule } from "@/src/contexts/vehicles/vehicles.module";
import { VehicleListItemRepository } from "@/src/contexts/vehicles/domain/repositories/vehicle-list-item.repository";
import { TypeOrmVehicleListItemRepository } from "@/src/contexts/vehicles/infrastructure/repositories/typeorm.vehicle-list-item-repository";
import { VehicleListItemEntity } from "@/src/contexts/vehicles/infrastructure/persistence/vehicle-list-item.entity";
import { VehicleListEntity } from "@/src/contexts/vehicles/infrastructure/persistence/vehicle-list.entity";

import { MailModule } from "@/src/contexts/shared/mail/mail.module";

import { CreateAlertFromVehicleUseCase } from "./application/create-alert-from-vehicle-use-case/create-alert-from-vehicle.use-case";
import { CreateAlertUseCase } from "./application/create-alert-use-case/create-alert.use-case";
import { DeleteAlertUseCase } from "./application/delete-alert-use-case/delete-alert.use-case";
import { FindAllAlertsUseCase } from "./application/find-all-alerts-use-case/find-all-alerts.use-case";
import { FindOneAlertUseCase } from "./application/find-one-alert-use-case/find-one-alert.use-case";
import { GetAlertNotificationPreferencesUseCase } from "./application/get-alert-notification-preferences-use-case/get-alert-notification-preferences.use-case";
import { MarkAlertViewedUseCase } from "./application/mark-alert-viewed-use-case/mark-alert-viewed.use-case";
import { ProcessAlertEventUseCase } from "./application/process-alert-event-use-case/process-alert-event.use-case";
import { ProcessSavedVehicleRemindersUseCase } from "./application/process-saved-vehicle-reminders-use-case/process-saved-vehicle-reminders.use-case";
import { SendAlertDigestUseCase } from "./application/send-alert-digest-use-case/send-alert-digest.use-case";
import { UpdateAlertNotificationPreferencesUseCase } from "./application/update-alert-notification-preferences-use-case/update-alert-notification-preferences.use-case";
import { UpdateAlertUseCase } from "./application/update-alert-use-case/update-alert.use-case";
import { MatchVehicleAlertsUseCase } from "./application/match-vehicle-alerts-use-case/match-vehicle-alerts.use-case";
import { AlertRepository } from "./domain/alert.repository";
import { AlertNotificationEventRepository } from "./domain/repositories/alert-notification-event.repository";
import { AlertNotificationPreferencesRepository } from "./domain/repositories/alert-notification-preferences.repository";
import { AlertNotificationDispatcher, AlertPushNotificationPort, AlertSmsNotificationPort } from "./domain/ports/alert-notification.port";
import { AlertEntity } from "./infrastructure/entities/alert.entity";
import { AlertNotificationEventEntity } from "./infrastructure/entities/alert-notification-event.entity";
import { AlertNotificationPreferencesEntity } from "./infrastructure/entities/alert-notification-preferences.entity";
import { CreateAlertController } from "./infrastructure/http-api/v1/create-alert/create-alert.controller";
import { CreateAlertFromVehicleController } from "./infrastructure/http-api/v1/create-alert-from-vehicle/create-alert-from-vehicle.controller";
import { DeleteAlertController } from "./infrastructure/http-api/v1/delete-alert/delete-alert.controller";
import { FindAllAlertsController } from "./infrastructure/http-api/v1/find-all-alerts/find-all-alerts.controller";
import { FindOneAlertController } from "./infrastructure/http-api/v1/find-one-alert/find-one-alert.controller";
import { MarkAlertViewedController } from "./infrastructure/http-api/v1/mark-alert-viewed/mark-alert-viewed.controller";
import { AlertNotificationPreferencesController } from "./infrastructure/http-api/v1/notification-preferences/alert-notification-preferences.controller";
import { UpdateAlertController } from "./infrastructure/http-api/v1/update-alert/update-alert.controller";
import { TypeOrmAlertRepository } from "./infrastructure/persistance/typeorm.alert-repository";
import { TypeOrmAlertNotificationEventRepository } from "./infrastructure/repositories/typeorm.alert-notification-event.repository";
import { TypeOrmAlertNotificationPreferencesRepository } from "./infrastructure/persistance/typeorm.alert-notification-preferences.repository";
import { ALERT_DIGEST_QUEUE } from "./infrastructure/queues/alert-processing.queue.constants";
import { AlertDigestEnqueueService } from "./infrastructure/queues/alert-processing-enqueue.service";
import { AlertProcessingEnqueueModule } from "./infrastructure/queues/alert-processing-enqueue.module";
import { AlertProcessingProcessor } from "./infrastructure/queues/alert-processing.processor";
import {
  AlertDigestBootstrapService,
  AlertDigestProcessor,
} from "./infrastructure/queues/alert-digest.processor";
import {
  AlertEmailNotificationService,
  AlertPushNotificationStubService,
  AlertSmsNotificationStubService,
} from "./infrastructure/services/alert-email-notification.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AlertEntity,
      AlertNotificationPreferencesEntity,
      AlertNotificationEventEntity,
      VehicleListItemEntity,
      VehicleListEntity,
    ]),
    AlertProcessingEnqueueModule,
    BullModule.registerQueue({ name: ALERT_DIGEST_QUEUE }),
    AuthModule,
    ProfileModule,
    MailModule,
    forwardRef(() => VehiclesModule),
  ],
  controllers: [
    AlertNotificationPreferencesController,
    CreateAlertController,
    CreateAlertFromVehicleController,
    FindAllAlertsController,
    MarkAlertViewedController,
    FindOneAlertController,
    UpdateAlertController,
    DeleteAlertController,
  ],
  providers: [
    CreateAlertUseCase,
    CreateAlertFromVehicleUseCase,
    FindAllAlertsUseCase,
    FindOneAlertUseCase,
    GetAlertNotificationPreferencesUseCase,
    UpdateAlertNotificationPreferencesUseCase,
    MarkAlertViewedUseCase,
    UpdateAlertUseCase,
    DeleteAlertUseCase,
    MatchVehicleAlertsUseCase,
    ProcessAlertEventUseCase,
    SendAlertDigestUseCase,
    ProcessSavedVehicleRemindersUseCase,
    AlertDigestEnqueueService,
    AlertProcessingProcessor,
    AlertDigestProcessor,
    AlertDigestBootstrapService,
    AlertEmailNotificationService,
    AlertPushNotificationStubService,
    AlertSmsNotificationStubService,
    TypeOrmAlertRepository,
    TypeOrmAlertNotificationPreferencesRepository,
    TypeOrmAlertNotificationEventRepository,
    TypeOrmVehicleListItemRepository,
    {
      provide: AlertRepository,
      useExisting: TypeOrmAlertRepository,
    },
    {
      provide: AlertNotificationPreferencesRepository,
      useExisting: TypeOrmAlertNotificationPreferencesRepository,
    },
    {
      provide: AlertNotificationEventRepository,
      useExisting: TypeOrmAlertNotificationEventRepository,
    },
    {
      provide: VehicleListItemRepository,
      useExisting: TypeOrmVehicleListItemRepository,
    },
    {
      provide: AlertNotificationDispatcher,
      useExisting: AlertEmailNotificationService,
    },
    {
      provide: AlertPushNotificationPort,
      useExisting: AlertPushNotificationStubService,
    },
    {
      provide: AlertSmsNotificationPort,
      useExisting: AlertSmsNotificationStubService,
    }
  ],
  exports: [AlertRepository, AlertProcessingEnqueueModule],
})
export class AlertsModule {}
