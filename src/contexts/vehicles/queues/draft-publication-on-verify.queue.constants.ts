export const DRAFT_PUBLICATION_ON_VERIFY_QUEUE = "draft-publication-on-verify";

export const DRAFT_PUBLICATION_ON_VERIFY_JOB = "publish-drafts";

export interface DraftPublicationOnVerifyJobData {
  profile_id: string;
}

/** Reintentos por si el borrador aún se está creando en cola. */
export const DRAFT_PUBLICATION_ON_VERIFY_DELAYS_MS = [2_000, 8_000, 20_000] as const;
