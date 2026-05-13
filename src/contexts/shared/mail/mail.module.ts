import { Global, Module } from "@nestjs/common";
import { MailerModule } from "@nestjs-modules/mailer";
import { BullModule } from "@nestjs/bullmq";

import { MailerConfig } from "@/src/config/nodemailer/mailer.config";

import { MailService } from "./mail.service";
import { OutboundMailEnqueueService } from "./outbound-mail-enqueue.service";
import { OutboundMailProcessor } from "./queues/outbound-mail.processor";
import { OUTBOUND_MAIL_QUEUE } from "./queues/outbound-mail.queue.constants";

@Global()
@Module({
  imports: [
    MailerModule.forRoot(MailerConfig),
    BullModule.registerQueue({ name: OUTBOUND_MAIL_QUEUE }),
  ],
  providers: [MailService, OutboundMailEnqueueService, OutboundMailProcessor],
  exports: [MailService, OutboundMailEnqueueService],
})
export class MailModule {}
