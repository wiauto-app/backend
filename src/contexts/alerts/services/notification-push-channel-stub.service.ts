import { Injectable, Logger } from "@nestjs/common";
import admin from "firebase-admin";
import type { NotifyInput } from "../types/notify-input";
import { envs } from "@/src/common/envs";

@Injectable()
export class NotificationPushChannelStubService {
  private readonly logger = new Logger(NotificationPushChannelStubService.name);
  private readonly admin: admin.App;
  constructor() {
    // this.admin = admin.initializeApp({
    //   credential: admin.cert({
    //     projectId: envs.FIREBASE_PROJECT_ID,
    //     clientEmail: envs.FIREBASE_CLIENT_EMAIL,
    //     privateKey: envs.FIREBASE_PRIVATE_KEY.replace(
    //       /\\n/g,
    //       '\n',
    //     ),
    //   }),
    // });
  } 

  async send(input: NotifyInput): Promise<void> {
    this.logger.log(
      `Push stub: ${input.category} para profile ${input.profile_id} (sin envío real)`,
    );
  }
}
