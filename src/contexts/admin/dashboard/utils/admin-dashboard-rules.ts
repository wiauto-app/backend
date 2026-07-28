import type {
  AdminDashboardDateRangeBounds,
  AdminDashboardGranularity,
} from "../types/admin-dashboard";

export const DEFAULT_ADMIN_DASHBOARD_RANGE_DAYS = 30;
export const ADMIN_DASHBOARD_MAX_RANGE_DAYS = 365;
export const ADMIN_DASHBOARD_DAY_GRANULARITY_MAX_DAYS = 45;

const DAY_MS = 24 * 60 * 60 * 1000;
const DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export class AdminDashboardDateRangeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AdminDashboardDateRangeError";
  }
}

const formatUtcDateOnly = (date: Date): string => date.toISOString().slice(0, 10);

const utcToday = (now: Date): Date =>
  new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

const parseUtcDateOnly = (dateStr: string): Date | null => {
  if (!DATE_ONLY_REGEX.test(dateStr)) {
    return null;
  }

  const date = new Date(`${dateStr}T00:00:00.000Z`);

  if (Number.isNaN(date.getTime()) || formatUtcDateOnly(date) !== dateStr) {
    return null;
  }

  return date;
};

export const resolveAdminDashboardGranularity = (
  daysInclusive: number,
): AdminDashboardGranularity => {
  if (daysInclusive <= ADMIN_DASHBOARD_DAY_GRANULARITY_MAX_DAYS) {
    return "day";
  }

  return "week";
};

const resolveStepInterval = (granularity: AdminDashboardGranularity): string => {
  if (granularity === "week") {
    return "1 week";
  }

  return "1 day";
};

export const resolveAdminDashboardDateRangeBounds = (params: {
  startDate?: string;
  endDate?: string;
  now?: Date;
}): AdminDashboardDateRangeBounds => {
  const now = params.now ?? new Date();
  const today = utcToday(now);

  let startDateStr = params.startDate;
  let endDateStr = params.endDate;

  const hasStart = startDateStr !== undefined && startDateStr !== "";
  const hasEnd = endDateStr !== undefined && endDateStr !== "";

  if (hasStart !== hasEnd) {
    throw new AdminDashboardDateRangeError(
      "startDate y endDate deben enviarse juntos",
    );
  }

  if (!hasStart && !hasEnd) {
    const end = today;
    const start = new Date(
      end.getTime() - (DEFAULT_ADMIN_DASHBOARD_RANGE_DAYS - 1) * DAY_MS,
    );
    startDateStr = formatUtcDateOnly(start);
    endDateStr = formatUtcDateOnly(end);
  }

  const resolvedStartDate = startDateStr ?? "";
  const resolvedEndDate = endDateStr ?? "";
  const start = parseUtcDateOnly(resolvedStartDate);
  const endDay = parseUtcDateOnly(resolvedEndDate);

  if (!start || !endDay) {
    throw new AdminDashboardDateRangeError(
      "startDate y endDate deben tener formato YYYY-MM-DD válido",
    );
  }

  if (start.getTime() > endDay.getTime()) {
    throw new AdminDashboardDateRangeError(
      "startDate debe ser anterior o igual a endDate",
    );
  }

  const days =
    Math.floor((endDay.getTime() - start.getTime()) / DAY_MS) + 1;

  if (days > ADMIN_DASHBOARD_MAX_RANGE_DAYS) {
    throw new AdminDashboardDateRangeError(
      `El rango no puede superar ${ADMIN_DASHBOARD_MAX_RANGE_DAYS} días`,
    );
  }

  const periodEnd = new Date(endDay.getTime() + DAY_MS);
  const previousStart = new Date(start.getTime() - days * DAY_MS);
  const end = new Date(periodEnd.getTime() - 1);
  const granularity = resolveAdminDashboardGranularity(days);

  return {
    days,
    start,
    end,
    currentStart: start,
    previousStart,
    periodEnd,
    granularity,
    stepInterval: resolveStepInterval(granularity),
    startDate: resolvedStartDate,
    endDate: resolvedEndDate,
  };
};
