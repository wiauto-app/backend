import { InjectQueue } from "@nestjs/bullmq";
import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { Queue } from "bullmq";

import {
  LEAD_SCORING_JOB_RECALCULATE,
  LEAD_SCORING_QUEUE,
  type LeadScoringRecalculateJobData,
  leadScoringJobId,
} from "./lead-scoring.queue.constants";

@Injectable()
export class LeadScoringEnqueueService {
  constructor(
    @InjectQueue(LEAD_SCORING_QUEUE)
    private readonly queue: Queue<LeadScoringRecalculateJobData>,
  ) {}

  async enqueueRecalculate(lead_id: string, delay_ms: number): Promise<void> {
    await this.queue.add(
      LEAD_SCORING_JOB_RECALCULATE,
      { lead_id },
      {
        jobId: leadScoringJobId(lead_id),
        delay: Math.max(0, delay_ms),
        removeOnComplete: true,
        removeOnFail: 50,
      },
    );
  }
}
