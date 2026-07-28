import type { OwnerStatisticsGranularity } from "../types/owner-statistics";

export const OWNER_STATISTICS_MAX_RANGE_DAYS = 366;

const DAY_MS = 24 * 60 * 60 * 1000;
const DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export interface OwnerStatisticsDateRangeBounds {
  since: string;
  until: string;
  period_start: Date;
  period_end: Date;
  granularity: OwnerStatisticsGranularity;
  step_interval: string;
}

export class OwnerStatisticsDateRangeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OwnerStatisticsDateRangeError";
  }
}

const formatUtcDateOnly = (date: Date): string => date.toISOString().slice(0, 10);

const utcToday = (now: Date): Date =>
  new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

const parseUtcDateOnly = (date_str: string): Date | null => {
  if (!DATE_ONLY_REGEX.test(date_str)) {
    return null;
  }

  const date = new Date(`${date_str}T00:00:00.000Z`);

  if (Number.isNaN(date.getTime()) || formatUtcDateOnly(date) !== date_str) {
    return null;
  }

  return date;
};

const resolveStepInterval = (granularity: OwnerStatisticsGranularity): string => {
  switch (granularity) {
    case "day": {
      return "1 day";
    }
    case "week": {
      return "1 week";
    }
    case "month": {
      return "1 month";
    }
  }
};

export const resolveOwnerStatisticsDateRangeBounds = (params: {
  since: string;
  until?: string;
  granularity?: OwnerStatisticsGranularity;
  now?: Date;
}): OwnerStatisticsDateRangeBounds => {
  const now = params.now ?? new Date();
  const today = utcToday(now);
  const granularity = params.granularity ?? "day";

  const since = parseUtcDateOnly(params.since);
  if (!since) {
    throw new OwnerStatisticsDateRangeError(
      "since debe tener formato YYYY-MM-DD válido",
    );
  }

  const until_date_str = params.until ?? formatUtcDateOnly(today);
  const until = parseUtcDateOnly(until_date_str);
  if (!until) {
    throw new OwnerStatisticsDateRangeError(
      "until debe tener formato YYYY-MM-DD válido",
    );
  }

  if (since.getTime() > until.getTime()) {
    throw new OwnerStatisticsDateRangeError(
      "since debe ser anterior o igual a until",
    );
  }

  const days = Math.floor((until.getTime() - since.getTime()) / DAY_MS) + 1;

  if (days > OWNER_STATISTICS_MAX_RANGE_DAYS) {
    throw new OwnerStatisticsDateRangeError(
      `El rango no puede superar ${OWNER_STATISTICS_MAX_RANGE_DAYS} días`,
    );
  }

  const period_end = new Date(until.getTime() + DAY_MS);

  return {
    since: formatUtcDateOnly(since),
    until: formatUtcDateOnly(until),
    period_start: since,
    period_end,
    granularity,
    step_interval: resolveStepInterval(granularity),
  };
};
