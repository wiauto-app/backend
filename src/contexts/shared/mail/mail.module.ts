import { Global, Module } from "@nestjs/common";
import { MailerModule } from "@nestjs-modules/mailer";

import { MailerConfig } from "@/src/config/nodemailer/mailer.config";

import { MailService } from "./mail.service";

@Global()
@Module({
  imports: [MailerModule.forRoot(MailerConfig)],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
