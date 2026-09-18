import { describe, expect, it } from "vitest";

import { buildViewsAreaChartSvg } from "@/src/contexts/shared/pdf-export/dashboard-pdf.charts";
import {
  formatPercentChange,
  formatPeriodRange,
} from "@/src/contexts/shared/pdf-export/dashboard-pdf.formatters";
import { buildDashboardPdfView } from "@/src/contexts/shared/pdf-export/dashboard-pdf.view-model";
import type { OwnerDashboard } from "@/src/contexts/vehicles/types/owner-dashboard";

const trend = (current: number, previous: number, change_percent: number | null) => ({
  current,
  previous,
  change_percent,
});

const buildDashboard = (overrides: Partial<OwnerDashboard> = {}): OwnerDashboard => ({
  period: {
    days: 30,
    start: "2026-08-20T00:00:00.000Z",
    end: "2026-09-18T23:59:59.000Z",
    granularity: "day",
  },
  summary: {
    active_stock: trend(12, 10, 20),
    views: trend(3450, 4100, -15.9),
    leads: trend(48, 30, 60),
    sales_value: trend(184500, 120000, null),
  },
  views_time_series: [
    { bucket_start: "2026-09-16T00:00:00.000Z", count: 120 },
    { bucket_start: "2026-09-17T00:00:00.000Z", count: 98 },
    { bucket_start: "2026-09-18T00:00:00.000Z", count: 140 },
  ],
  weekly_activity: { visits: 640, messages_received: 21 },
  opportunities: { unread_messages: 1 },
  inventory: {
    active_count: 10,
    stock_age_buckets: [{ label: "0-30 días", count: 7, percentage: 70 }],
    quality_distribution: [
      { tier: "high", label: "Alta", count: 3 },
      { tier: "low", label: "Baja", count: 1 },
    ],
    price_deviation: { above_market: [], below_market: [] },
  },
  dealership: null,
  support: { phone: "", faq_url: "" },
  ...overrides,
});

describe("formatters del PDF del dashboard", () => {
  it("replica el texto de variación de la UI", () => {
    expect(formatPercentChange(null)).toBe("Sin datos previos");
    expect(formatPercentChange(12.5)).toBe("+12.5% vs período anterior");
    expect(formatPercentChange(-3)).toBe("-3% vs período anterior");
  });

  it("formatea el rango del período en es-ES", () => {
    expect(formatPeriodRange("2026-08-20T00:00:00.000Z", "2026-09-18T23:59:59.000Z")).toBe(
      "20 ago 2026 – 18 sept 2026",
    );
  });
});

describe("buildViewsAreaChartSvg", () => {
  it("dibuja área, línea y etiquetas del eje X", () => {
    const svg = buildViewsAreaChartSvg(buildDashboard().views_time_series, "day");

    expect(svg).toContain("<svg");
    expect(svg).toContain("url(#viewsFill)");
    expect(svg).toContain("16 sept");
    expect(svg).not.toContain("NaN");
  });

  it("dibuja un punto cuando solo hay un bucket", () => {
    const svg = buildViewsAreaChartSvg(
      [{ bucket_start: "2026-09-18T00:00:00.000Z", count: 7 }],
      "day",
    );

    expect(svg).toContain("<circle");
    expect(svg).not.toContain("NaN");
  });

  it("no genera NaN si todas las vistas son cero", () => {
    const svg = buildViewsAreaChartSvg(
      [
        { bucket_start: "2026-09-17T00:00:00.000Z", count: 0 },
        { bucket_start: "2026-09-18T00:00:00.000Z", count: 0 },
      ],
      "day",
    );

    expect(svg).not.toContain("NaN");
  });

  it("etiqueta también el último día cuando queda separado de la última etiqueta regular", () => {
    const buckets = Array.from({ length: 32 }, (_, index) => ({
      bucket_start: new Date(Date.UTC(2026, 7, 1 + index)).toISOString(),
      count: index + 1,
    }));

    const svg = buildViewsAreaChartSvg(buckets, "day");

    expect(svg).toContain(">1 sept<");
  });
});

describe("buildDashboardPdfView", () => {
  it("marca como negativa la variación descendente y como positiva la ausente", () => {
    const { kpis } = buildDashboardPdfView(buildDashboard(), new Date("2026-09-18T18:00:00Z"));

    expect(kpis.map((kpi) => kpi.label)).toEqual(["Stock activo", "Vistas", "Leads", "Ventas"]);
    expect(kpis[1].trend_color).toBe("#ef4444");
    expect(kpis[3].trend_text).toBe("Sin datos previos");
    expect(kpis[3].trend_color).toBe("#16a34a");
  });

  it("calcula los porcentajes de calidad sobre el total y asigna color por nivel", () => {
    const { inventory } = buildDashboardPdfView(buildDashboard(), new Date());

    expect(inventory.quality.rows).toEqual([
      { label: "Alta", value: "3 (75%)", width: 75, color: "#22c55e" },
      { label: "Baja", value: "1 (25%)", width: 25, color: "#f87171" },
    ]);
  });

  it("refleja los estados vacíos de la UI", () => {
    const view = buildDashboardPdfView(
      buildDashboard({
        views_time_series: [],
        opportunities: { unread_messages: 0 },
        inventory: {
          active_count: 0,
          stock_age_buckets: [],
          quality_distribution: [],
          price_deviation: { above_market: [], below_market: [] },
        },
      }),
      new Date(),
    );

    expect(view.views.has_data).toBe(false);
    expect(view.views.chart_svg).toBeNull();
    expect(view.opportunities.is_empty).toBe(true);
    expect(view.inventory.has_stock).toBe(false);
    expect(view.inventory.subtitle).toBe("Sin anuncios activos");
    expect(view.inventory.price_deviation.is_empty).toBe(true);
  });

  it("construye la tarjeta de concesionaria con 5 estrellas y omite datos ausentes", () => {
    const withRating = buildDashboardPdfView(
      buildDashboard({
        dealership: { name: "Auto García", phone_code: "+34", phone: "600", rating: 4.4, reviews_count: 27 },
      }),
      new Date(),
    );
    const withoutRating = buildDashboardPdfView(
      buildDashboard({
        dealership: { name: "Auto García", phone_code: null, phone: null, rating: null, reviews_count: 0 },
      }),
      new Date(),
    );

    expect(withRating.dealership?.stars).toHaveLength(5);
    expect(withRating.dealership?.phone).toBe("+34 600");
    expect(withRating.dealership?.rating_value).toBe(4.4);
    expect(withoutRating.dealership?.has_rating).toBe(false);
    expect(withoutRating.dealership?.phone).toBeNull();
    expect(withoutRating.dealership?.reviews_label).toBe("Sin reseñas publicadas");
  });

  it("omite el teléfono y el FAQ de soporte cuando vienen vacíos", () => {
    const { support } = buildDashboardPdfView(buildDashboard(), new Date());

    expect(support.phone).toBeNull();
    expect(support.faq_url).toBeNull();
  });
});
