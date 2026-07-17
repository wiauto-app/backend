import { STATUS_VEHICLE, type StatusVehicle } from "../types/vehicle";
import type { OwnerVehicleStatTrend } from "../types/owner-vehicle-list-item";

export const RENEW_EXTENSION_MS = 90 * 24 * 60 * 60 * 1000;
export const RENEW_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;
export const FEATURED_DURATION_MS = 30 * 24 * 60 * 60 * 1000;
export const SCHEDULE_MAX_FUTURE_MS = 90 * 24 * 60 * 60 * 1000;
export const TREND_PERIOD_MS = 30 * 24 * 60 * 60 * 1000;

export const calculateChangePercent = (
  current: number,
  previous: number,
): number | null => {
  if (previous === 0) {
    return null;
  }
  return Math.round(((current - previous) / previous) * 1000) / 10;
};

export const buildStatTrend = (
  current: number,
  previous: number,
): OwnerVehicleStatTrend => ({
  current,
  previous,
  change_percent: calculateChangePercent(current, previous),
});

export const isVehicleExpired = (
  expires_at: Date,
  now: Date = new Date(),
): boolean => expires_at.getTime() < now.getTime();

export const getDaysUntilExpiry = (
  expires_at: Date,
  now: Date = new Date(),
): number =>
  Math.ceil((expires_at.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));

export const isFeaturedActive = (params: {
  is_featured: boolean;
  featured_expires_at: Date | null;
  now?: Date;
}): boolean => {
  if (!params.is_featured) {
    return false;
  }

  if (!params.featured_expires_at) {
    return true;
  }

  const now = params.now ?? new Date();
  return params.featured_expires_at.getTime() > now.getTime();
};

export const canFeatureVehicle = (params: {
  status: StatusVehicle;
  is_featured_active: boolean;
}): boolean =>
  params.status === STATUS_VEHICLE.ACTIVE && !params.is_featured_active;

export const canRenewVehicle = (params: {
  status: StatusVehicle;
  renewed_at: Date | null;
  now?: Date;
}): boolean => {
  const now = params.now ?? new Date();

  if (params.status !== STATUS_VEHICLE.ACTIVE) {
    return false;
  }

  if (params.renewed_at) {
    const cooldown_end = params.renewed_at.getTime() + RENEW_COOLDOWN_MS;
    if (now.getTime() < cooldown_end) {
      return false;
    }
  }

  return true;
};

export const canScheduleVehicle = (status: StatusVehicle): boolean =>
  status === STATUS_VEHICLE.ACTIVE ||
  status === STATUS_VEHICLE.INACTIVE ||
  status === STATUS_VEHICLE.PENDING;

export const canOwnerReactivate = (params: {
  status: StatusVehicle;
  status_change_message: string | null;
  scheduled_publish_at: Date | null;
}): boolean =>
  params.status === STATUS_VEHICLE.INACTIVE &&
  params.scheduled_publish_at === null &&
  params.status_change_message === null;

export const computeRenewedExpiresAt = (
  expires_at: Date,
  now: Date = new Date(),
): Date => new Date(Math.max(expires_at.getTime(), now.getTime()) + RENEW_EXTENSION_MS);
