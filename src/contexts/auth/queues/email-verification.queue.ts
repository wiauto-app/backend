import { Injectable } from "@nestjs/common";
import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Job } from "bullmq";

import { EmailVerificationService } from "../services/email-verification.service";
import { EMAIL_VERIFICATION_QUEUE, EmailVerificationJobData } from "./email-verification.queue.constants";

@Processor(EMAIL_VERIFICATION_QUEUE)
@Injectable()
export class EmailVerificationQueue extends WorkerHost {
  constructor(private readonly emailVerificationService: EmailVerificationService) {
    super();
  }

  async process(job: Job<EmailVerificationJobData>): Promise<void> {
    const { userId, email } = job.data;
    await this.emailVerificationService.sendVerificationForUser(userId, email);
  }
}
