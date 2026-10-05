export const APPRAISAL_OFFERS_QUEUE = "appraisal-offers";

/** Avisa a los concesionarios de una tasación abierta a ofertas. */
export const APPRAISAL_OFFERS_JOB_NOTIFY_OPPORTUNITY = "notify-opportunity";
/** Cierra las tasaciones cuya ventana de ofertas venció (diario). */
export const APPRAISAL_OFFERS_JOB_EXPIRE = "expire-open-appraisals";

export interface AppraisalNotifyOpportunityJobData {
  appraisal_id: string;
}
