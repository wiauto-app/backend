export const LEAD_SCORING_QUEUE = "lead-scoring";

export const LEAD_SCORING_JOB_RECALCULATE = "recalculate";

export interface LeadScoringRecalculateJobData {
  lead_id: string;
}

export const leadScoringJobId = (lead_id: string): string => `lead-scoring-${lead_id}`;
