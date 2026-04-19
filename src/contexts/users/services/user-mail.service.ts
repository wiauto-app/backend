import { Injectable } from "@nestjs/common";

import { MailService } from "../../shared/mail/mail.service";

@Injectable()
export class UserMailService {
  constructor(private readonly mailService: MailService) {}

  sendEmailVerification(to: string, verificationLink: string): Promise<void> {
    return this.mailService.sendEmailVerificationEmail(to, verificationLink, to);
  }
}
