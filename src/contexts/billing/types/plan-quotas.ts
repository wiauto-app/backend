export interface PlanQuotas {
  max_listings: number;
  max_photos: number;
  allow_videos: boolean;
  featured_monthly?: number;
}

export const FREE_PLAN_QUOTAS: PlanQuotas = {
  max_listings: 3,
  max_photos: 6,
  allow_videos: false,
};

export const normalizePlanQuotas = (
  input?: Partial<PlanQuotas> | null,
): PlanQuotas => {
  const max_listings =
    typeof input?.max_listings === "number" && input.max_listings >= 0
      ? Math.floor(input.max_listings)
      : FREE_PLAN_QUOTAS.max_listings;
  const max_photos =
    typeof input?.max_photos === "number" && input.max_photos >= 0
      ? Math.floor(input.max_photos)
      : FREE_PLAN_QUOTAS.max_photos;
  const allow_videos =
    typeof input?.allow_videos === "boolean"
      ? input.allow_videos
      : FREE_PLAN_QUOTAS.allow_videos;

  const quotas: PlanQuotas = {
    max_listings,
    max_photos,
    allow_videos,
  };

  if (
    typeof input?.featured_monthly === "number" &&
    input.featured_monthly >= 0
  ) {
    quotas.featured_monthly = Math.floor(input.featured_monthly);
  }

  return quotas;
};
