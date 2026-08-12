import { Injectable, Logger } from "@nestjs/common";
import { NotificationDto } from "../dto/notificationDto";
import { getMessaging } from "firebase-admin/messaging";
@Injectable()
export class NotificationPushChannelStubService {
  private readonly logger = new Logger(NotificationPushChannelStubService.name);



  async send({
    token,
    title,
    body,
    icon,
  }: NotificationDto): Promise<string> {
    const response = await getMessaging().send({
      token,

      notification: {
        title,
        body,
        ...(icon ? { imageUrl: icon } : {}),
      },

      android: {
        notification: {
          ...(icon ? { imageUrl: icon } : {}),
          sound: "default",
        },
      },

      apns: {
        payload: {
          aps: {
            sound: "default",
          },
        },
      },
    });

    this.logger.log(`Notification sent: ${response}`);

    return response;
  }
}
