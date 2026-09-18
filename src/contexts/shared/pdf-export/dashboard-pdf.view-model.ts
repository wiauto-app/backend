import type {
  OwnerDashboard,
  OwnerDashboardPriceDeviationItem,
  OwnerDashboardQualityTier,
} from "@/src/contexts/vehicles/types/owner-dashboard";
import { buildViewsAreaChartSvg } from "./dashboard-pdf.charts";
import {
  formatEuros,
  formatGeneratedAt,
  formatNumber,
  formatPercentChange,
  formatPeriodRange,
  formatPhone,
  getViewsChartSubtitle,
} from "./dashboard-pdf.formatters";
import { ICON_BODIES, type IconName } from "./pdf-icons";

const COLOR_POSITIVE = "#16a34a";
const COLOR_NEGATIVE = "#ef4444";
const COLOR_MUTED = "#9ca3af";
const COLOR_BLUE = "#2563eb";
const COLOR_STAR = "#f59e0b";

const TIER_COLORS: Record<OwnerDashboardQualityTier, string> = {
  high: "#22c55e",
  medium: "#f59e0b",
  low: "#f87171",
};

export const renderIcon = (
  name: IconName,
  { size = 16, color = "currentColor", fill = "none" } = {},
): string =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" ` +
  `fill="${fill}" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">` +
  `${ICON_BODIES[name]}</svg>`;

const isPositive = (changePercent: number | null): boolean => (changePercent ?? 0) >= 0;

const buildKpi = (
  label: string,
  icon: IconName,
  value: string,
  changePercent: number | null,
) => {
  const positive = isPositive(changePercent);
  const color = positive ? COLOR_POSITIVE : COLOR_NEGATIVE;

  return {
    label,
    value,
    icon_svg: renderIcon(icon, { size: 15, color: COLOR_MUTED }),
    trend_svg: renderIcon(positive ? "trendingUp" : "trendingDown", { size: 12, color }),
    trend_text: formatPercentChange(changePercent),
    trend_color: color,
  };
};

const buildDeviationList = (items: OwnerDashboardPriceDeviationItem[]) =>
  items.map((item) => ({
    display_name: item.display_name,
    detail: `Precio: ${formatEuros(item.price)} · Mercado: ${formatEuros(item.benchmark_price)}`,
    deviation: `${item.deviation_percent > 0 ? "+" : ""}${formatNumber(item.deviation_percent)}%`,
  }));

export const buildDashboardPdfView = (data: OwnerDashboard, generatedAt: Date) => {
  const { period, summary, inventory, dealership, support } = data;

  const stockAgeTotal = inventory.stock_age_buckets.reduce((sum, b) => sum + b.count, 0);
  const qualityTotal = inventory.quality_distribution.reduce((sum, b) => sum + b.count, 0);
  const hasActiveStock = inventory.active_count > 0;
  const hasViews = data.views_time_series.length > 0;
  const unread = data.opportunities.unread_messages;
  const rating = dealership?.rating ?? null;

  return {
    header: {
      title: "Resumen y analytics",
      subtitle:
        "Rendimiento de tus anuncios, estado del inventario y oportunidades pendientes.",
      period_label: formatPeriodRange(period.start, period.end),
      period_days: `${period.days} ${period.days === 1 ? "día" : "días"}`,
      generated_label: formatGeneratedAt(generatedAt),
      dealership_name: dealership?.name ?? null,
    },

    kpis: [
      buildKpi("Stock activo", "car", formatNumber(summary.active_stock.current), summary.active_stock.change_percent),
      buildKpi("Vistas", "eye", formatNumber(summary.views.current), summary.views.change_percent),
      buildKpi("Leads", "messageCircle", formatNumber(summary.leads.current), summary.leads.change_percent),
      buildKpi("Ventas", "wallet", formatEuros(summary.sales_value.current), summary.sales_value.change_percent),
    ],

    views: {
      subtitle: getViewsChartSubtitle(period.granularity),
      has_data: hasViews,
      chart_svg: hasViews
        ? buildViewsAreaChartSvg(data.views_time_series, period.granularity)
        : null,
    },

    weekly: {
      visits: formatNumber(data.weekly_activity.visits),
      messages: formatNumber(data.weekly_activity.messages_received),
      eye_svg: renderIcon("eye", { size: 15 }),
      message_svg: renderIcon("messageSquare", { size: 15 }),
    },

    opportunities: {
      inbox_svg: renderIcon("inbox", { size: 18, color: COLOR_BLUE }),
      unread: formatNumber(unread),
      is_empty: unread === 0,
      unread_label: unread === 1 ? "mensaje sin revisar" : "mensajes sin revisar",
    },

    inventory: {
      has_stock: hasActiveStock,
      subtitle: hasActiveStock
        ? `${formatNumber(inventory.active_count)} vehículos en stock`
        : "Sin anuncios activos",
      stock_age: {
        has_data: stockAgeTotal > 0,
        rows: inventory.stock_age_buckets.map((bucket) => ({
          label: bucket.label,
          value: `${formatNumber(bucket.count)} (${bucket.percentage}%)`,
          width: Math.min(bucket.percentage, 100),
          color: COLOR_BLUE,
        })),
      },
      quality: {
        has_data: qualityTotal > 0,
        rows: inventory.quality_distribution.map((item) => {
          const percentage = qualityTotal > 0 ? Math.round((item.count / qualityTotal) * 100) : 0;

          return {
            label: item.label,
            value: `${formatNumber(item.count)} (${percentage}%)`,
            width: percentage,
            color: TIER_COLORS[item.tier],
          };
        }),
      },
      price_deviation: {
        is_empty:
          inventory.price_deviation.above_market.length === 0 &&
          inventory.price_deviation.below_market.length === 0,
        above: buildDeviationList(inventory.price_deviation.above_market),
        below: buildDeviationList(inventory.price_deviation.below_market),
      },
    },

    dealership: dealership
      ? {
          name: dealership.name,
          phone: formatPhone(dealership.phone_code, dealership.phone),
          building_svg: renderIcon("building2", { size: 18, color: COLOR_BLUE }),
          phone_svg: renderIcon("phone", { size: 14 }),
          has_rating: rating !== null,
          rating_value: rating === null ? null : Math.round(rating * 10) / 10,
          stars: Array.from({ length: 5 }, (_, index) =>
            renderIcon("star", {
              size: 14,
              color: rating !== null && index < Math.round(rating) ? COLOR_STAR : "#e5e7eb",
              fill: rating !== null && index < Math.round(rating) ? COLOR_STAR : "none",
            }),
          ),
          reviews_label:
            dealership.reviews_count > 0
              ? `${formatNumber(dealership.reviews_count)} reseñas`
              : "Sin reseñas publicadas",
        }
      : null,

    support: {
      headphones_svg: renderIcon("headphones", { size: 18, color: COLOR_BLUE }),
      phone_svg: renderIcon("phone", { size: 14 }),
      phone: support.phone || null,
      faq_url: support.faq_url || null,
    },
  };
};

export type DashboardPdfView = ReturnType<typeof buildDashboardPdfView>;
