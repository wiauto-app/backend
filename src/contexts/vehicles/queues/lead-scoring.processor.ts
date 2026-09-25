import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Job } from "bullmq";

import {
  LEAD_SCORING_JOB_RECALCULATE,
  LEAD_SCORING_QUEUE,
  type LeadScoringRecalculateJobData,
} from "./lead-scoring.queue.constants";
import { LeadScoringService } from "../services/lead-scoring.service";

@Processor(LEAD_SCORING_QUEUE)
export class LeadScoringProcessor extends WorkerHost {
  constructor(private readonly lead_scoring_service: LeadScoringService) {
    super();
  }

  async process(job: Job<LeadScoringRecalculateJobData>): Promise<void> {
    if (job.name !== LEAD_SCORING_JOB_RECALCULATE) {
      return;
    }
    await this.lead_scoring_service.recalculateForLeadId(job.data.lead_id);
  }
}
