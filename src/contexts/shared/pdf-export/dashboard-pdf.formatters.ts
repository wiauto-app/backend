import type { OwnerDashboardGranularity } from "@/src/contexts/vehicles/types/owner-dashboard";

const LOCALE = "es-ES";
const REPORT_TIME_ZONE = "Europe/Madrid";

const numberFormat = new Intl.NumberFormat(LOCALE);
const eurosFormat = new Intl.NumberFormat(LOCALE, {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

export const formatNumber = (value: number): string => numberFormat.format(value);

export const formatEuros = (value: number): string => eurosFormat.format(value);

export const formatPercentChange = (changePercent: number | null): string => {
  if (changePercent === null) {
    return "Sin datos previos";
  }

  const prefix = changePercent > 0 ? "+" : "";
  return `${prefix}${changePercent}% vs período anterior`;
};

export const formatBucketDate = (
  isoDate: string,
  granularity: OwnerDashboardGranularity,
): string => {
  const date = new Date(isoDate);

  if (Number.isNaN(date.getTime())) {
    return isoDate;
  }

  const options: Intl.DateTimeFormatOptions =
    granularity === "month"
      ? { month: "short", year: "numeric", timeZone: "UTC" }
      : { day: "numeric", month: "short", timeZone: "UTC" };

  return new Intl.DateTimeFormat(LOCALE, options).format(date);
};

export const getViewsChartSubtitle = (
  granularity: OwnerDashboardGranularity,
): string => {
  switch (granularity) {
    case "day":
      return "Evolución diaria de visitas en el período seleccionado.";
    case "week":
      return "Evolución semanal de visitas en el período seleccionado.";
    case "month":
      return "Evolución mensual de visitas en el período seleccionado.";
  }
};

export const formatPhone = (
  phoneCode: string | null | undefined,
  phone: string | null | undefined,
): string | null => {
  if (!phone) {
    return null;
  }

  return phoneCode ? `${phoneCode} ${phone}` : phone;
};

export const formatPeriodRange = (startIso: string, endIso: string): string => {
  const format = new Intl.DateTimeFormat(LOCALE, {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });

  return `${format.format(new Date(startIso))} – ${format.format(new Date(endIso))}`;
};

export const formatGeneratedAt = (date: Date): string =>
  new Intl.DateTimeFormat(LOCALE, {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: REPORT_TIME_ZONE,
  }).format(date);

export const formatIsoDay = (iso: string): string => iso.slice(0, 10);
