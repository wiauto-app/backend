import { forwardRef, Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";
import { TypeOrmModule } from "@nestjs/typeorm";

import { envs } from "@/src/common/envs";
import { AuthModule } from "@/src/contexts/auth/auth.module";
import { WsJwtGuard } from "@/src/contexts/auth/guards/ws-jwt.guard";
import { ChatEntity } from "@/src/contexts/chat/entities/chat.entity";
import { ChatParticipantStateEntity } from "@/src/contexts/chat/entities/chat-participant-state.orm.entity";
import { TypeOrmChatParticipantStateRepository } from "@/src/contexts/chat/repositories/typeorm.chat-participant-state-repository";
import { ProfileDevicesModule } from "@/src/contexts/profile_devices/profile-devices.module";
import { ProfileModule } from "@/src/contexts/profiles/profile.module";
import { VehiclesModule } from "@/src/contexts/vehicles/vehicles.module";
import { TypeOrmVehicleListItemRepository } from "@/src/contexts/vehicles/repositories/typeorm.vehicle-list-item-repository";
import { VehicleListItemEntity } from "@/src/contexts/vehicles/entities/vehicle-list-item.entity";
import { VehicleListEntity } from "@/src/contexts/vehicles/entities/vehicle-list.entity";
import { VehicleEngagementModule } from "@/src/contexts/vehicles/vehicle-engagement/vehicle-engagement.module";

import { MailModule } from "@/src/contexts/shared/mail/mail.module";

import { AlertService } from "./services/alert.service";
import { AlertNotificationService } from "./services/alert-notification.service";
import { NotificationChannelDispatcher } from "./services/notification-channel-dispatcher.service";
import { NotificationEmailChannelService } from "./services/notification-email-channel.service";
import { NotificationInAppChannelService } from "./services/notification-in-app-channel.service";
import { NotificationPushChannelService } from "./services/notification-push-channel.service";
import { PushBadgeService } from "./services/push-badge.service";
import { ExpoPushClient } from "./clients/expo-push.client";
import { FcmPushClient } from "./clients/fcm-push.client";
import { PUSH_CONFIG, type PushConfig } from "./types/push-config";
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
import { PushMaintenanceEnqueueService } from "./queues/push-maintenance-enqueue.service";
import {
  PushMaintenanceBootstrapService,
  PushMaintenanceProcessor,
} from "./queues/push-maintenance.processor";
import { PUSH_MAINTENANCE_QUEUE } from "./queues/push-maintenance.queue.constants";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AlertEntity,
      AlertNotificationPreferencesEntity,
      AlertNotificationEventEntity,
      NotificationEntity,
      VehicleListItemEntity,
      VehicleListEntity,
      ChatEntity,
      ChatParticipantStateEntity,
    ]),
    AlertProcessingEnqueueModule,
    BullModule.registerQueue({ name: ALERT_DIGEST_QUEUE }),
    BullModule.registerQueue({ name: PUSH_MAINTENANCE_QUEUE }),
    ProfileDevicesModule,
    forwardRef(() => AuthModule),
    forwardRef(() => ProfileModule),
    MailModule,
    forwardRef(() => VehiclesModule),
    VehicleEngagementModule,
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
    NotificationPushChannelService,
    PushBadgeService,
    FcmPushClient,
    ExpoPushClient,
    PushMaintenanceEnqueueService,
    PushMaintenanceProcessor,
    PushMaintenanceBootstrapService,
    {
      provide: PUSH_CONFIG,
      useFactory: (): PushConfig => ({
        enabled: envs.PUSH_NOTIFICATIONS_ENABLED,
        allowed_user_ids: envs.PUSH_ALLOWED_USER_IDS,
        dry_run: envs.PUSH_DRY_RUN,
        stale_device_days: envs.PUSH_DEVICE_STALE_DAYS,
      }),
    },
    TypeOrmChatParticipantStateRepository,
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
