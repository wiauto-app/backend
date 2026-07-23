import { forwardRef, Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";
import { TypeOrmModule } from "@nestjs/typeorm";

import { AuthModule } from "@/src/contexts/auth/auth.module";
import { WsJwtGuard } from "@/src/contexts/auth/guards/ws-jwt.guard";
import { ProfileModule } from "@/src/contexts/profiles/profile.module";
import { VehiclesModule } from "@/src/contexts/vehicles/vehicles.module";
import { TypeOrmVehicleListItemRepository } from "@/src/contexts/vehicles/repositories/typeorm.vehicle-list-item-repository";
import { VehicleListItemEntity } from "@/src/contexts/vehicles/entities/vehicle-list-item.entity";
import { VehicleListEntity } from "@/src/contexts/vehicles/entities/vehicle-list.entity";

import { MailModule } from "@/src/contexts/shared/mail/mail.module";

import { AlertService } from "./services/alert.service";
import { AlertNotificationService } from "./services/alert-notification.service";
import { NotificationChannelDispatcher } from "./services/notification-channel-dispatcher.service";
import { NotificationEmailChannelService } from "./services/notification-email-channel.service";
import { NotificationInAppChannelService } from "./services/notification-in-app-channel.service";
import { NotificationPushChannelStubService } from "./services/notification-push-channel-stub.service";
import { NotificationSmsChannelStubService } from "./services/notification-sms-channel-stub.service";
import { NotificationWhatsappChannelService } from "./services/notification-whatsapp-channel.service";
import { WhatsAppCloudClient } from "./clients/whatsapp-cloud.client";
import { NotificationInboxService } from "./services/notification-inbox.service";
import { TypeOrmAlertRepository } from "@/src/contexts/alerts/repositories/typeorm.alert-repository";
import { TypeOrmAlertNotificationEventRepository } from "@/src/contexts/alerts/repositories/typeorm.alert-notification-event.repository";
import { TypeOrmAlertNotificationPreferencesRepository } from "@/src/contexts/alerts/repositories/typeorm.alert-notification-preferences.repository";
import { TypeOrmNotificationRepository } from "@/src/contexts/alerts/repositories/typeorm.notification.repository";
import { AlertNotificationDispatcher } from "./ports/alert-notification.port";
import { AlertEntity } from "./entities/alert.entity";
import { AlertNotificationEventEntity } from "./entities/alert-notification-event.entity";
import { AlertNotificationPreferencesEntity } from "./entities/alert-notification-preferences.entity";
import { NotificationEntity } from "./entities/notification.entity";
import { CreateAlertController } from "./api/v1/create-alert/create-alert.controller";
import { CreateAlertFromVehicleController } from "./api/v1/create-alert-from-vehicle/create-alert-from-vehicle.controller";
import { DeleteAlertController } from "./api/v1/delete-alert/delete-alert.controller";
import { FindAllAlertsController } from "./api/v1/find-all-alerts/find-all-alerts.controller";
import { FindOneAlertController } from "./api/v1/find-one-alert/find-one-alert.controller";
import { MarkAlertViewedController } from "./api/v1/mark-alert-viewed/mark-alert-viewed.controller";
import { AlertNotificationPreferencesController } from "./api/v1/notification-preferences/alert-notification-preferences.controller";
import { NotificationInboxController } from "./api/v1/notifications/notification-inbox.controller";
import { UpdateAlertController } from "./api/v1/update-alert/update-alert.controller";
import { NotificationGateway } from "./gateways/notification.gateway";
import { ALERT_DIGEST_QUEUE } from "./queues/alert-processing.queue.constants";
import { AlertDigestEnqueueService } from "./queues/alert-processing-enqueue.service";
import { AlertProcessingEnqueueModule } from "./queues/alert-processing-enqueue.module";
import { AlertProcessingProcessor } from "./queues/alert-processing.processor";
import {
  AlertDigestBootstrapService,
  AlertDigestProcessor,
} from "./queues/alert-digest.processor";
import { AlertEmailNotificationService } from "./services/alert-email-notification.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AlertEntity,
      AlertNotificationPreferencesEntity,
      AlertNotificationEventEntity,
      NotificationEntity,
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
    NotificationInboxController,
    CreateAlertController,
    CreateAlertFromVehicleController,
    FindAllAlertsController,
    MarkAlertViewedController,
    FindOneAlertController,
    UpdateAlertController,
    DeleteAlertController,
  ],
  providers: [
    AlertService,
    AlertNotificationService,
    NotificationInboxService,
    NotificationChannelDispatcher,
    NotificationEmailChannelService,
    NotificationInAppChannelService,
    NotificationPushChannelStubService,
    NotificationSmsChannelStubService,
    WhatsAppCloudClient,
    NotificationWhatsappChannelService,
    NotificationGateway,
    WsJwtGuard,
    AlertDigestEnqueueService,
    AlertProcessingProcessor,
    AlertDigestProcessor,
    AlertDigestBootstrapService,
    AlertEmailNotificationService,
    TypeOrmAlertRepository,
    TypeOrmAlertNotificationPreferencesRepository,
    TypeOrmAlertNotificationEventRepository,
    TypeOrmNotificationRepository,
    TypeOrmVehicleListItemRepository,
    {
      provide: AlertNotificationDispatcher,
      useExisting: AlertEmailNotificationService,
    },
  ],
  exports: [
    TypeOrmAlertRepository,
    AlertProcessingEnqueueModule,
    AlertService,
    NotificationChannelDispatcher,
  ],
})
export class AlertsModule {}
