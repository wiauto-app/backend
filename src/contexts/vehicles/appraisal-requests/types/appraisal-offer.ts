export const APPRAISAL_OFFER_STATUS = {
  PENDING: "pending",
  ACCEPTED: "accepted",
  REJECTED: "rejected",
  WITHDRAWN: "withdrawn",
  EXPIRED: "expired",
} as const;

export type AppraisalOfferStatus =
  (typeof APPRAISAL_OFFER_STATUS)[keyof typeof APPRAISAL_OFFER_STATUS];

/** Días que una tasación queda abierta a ofertas. */
export const APPRAISAL_OFFERS_WINDOW_DAYS = 7;
