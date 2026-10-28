import { Injectable } from "@nestjs/common";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue } from "bullmq";

import {
  DRAFT_PUBLICATION_ON_VERIFY_DELAYS_MS,
  DRAFT_PUBLICATION_ON_VERIFY_JOB,
  DRAFT_PUBLICATION_ON_VERIFY_QUEUE,
  DraftPublicationOnVerifyJobData,
} from "../queues/draft-publication-on-verify.queue.constants";

@Injectable()
export class DraftPublicationOnVerifyEnqueueService {
  constructor(
    @InjectQueue(DRAFT_PUBLICATION_ON_VERIFY_QUEUE)
    private readonly draft_publication_on_verify_queue: Queue<DraftPublicationOnVerifyJobData>,
  ) {}

  /** Tras verificar el correo: republicar borradores cuando el job de creación termine. */
  async scheduleAfterEmailVerification(profile_id: string): Promise<void> {
    const data: DraftPublicationOnVerifyJobData = { profile_id };

    await Promise.all(
      DRAFT_PUBLICATION_ON_VERIFY_DELAYS_MS.map((delay) =>
        this.draft_publication_on_verify_queue.add(
          DRAFT_PUBLICATION_ON_VERIFY_JOB,
          data,
          { delay, attempts: 1 },
        ),
      ),
    );
  }
}
