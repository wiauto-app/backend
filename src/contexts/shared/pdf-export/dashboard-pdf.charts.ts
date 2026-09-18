import type {
  OwnerDashboardGranularity,
  OwnerDashboardViewsBucket,
} from "@/src/contexts/vehicles/types/owner-dashboard";
import { formatBucketDate, formatNumber } from "./dashboard-pdf.formatters";

const CHART_COLOR = "#2563eb";
const GRID_COLOR = "#e5e7eb";
const TICK_COLOR = "#6b7280";
const MAX_X_LABELS = 8;
const Y_TICK_COUNT = 4;

type Point = [number, number];

const niceStep = (max: number, tickCount: number): number => {
  const rough = Math.max(max, 1) / tickCount;
  const magnitude = 10 ** Math.floor(Math.log10(rough));
  const residual = rough / magnitude;
  const factor = residual <= 1 ? 1 : residual <= 2 ? 2 : residual <= 5 ? 5 : 10;

  return Math.max(1, factor * magnitude);
};

const sign = (value: number): number => (value < 0 ? -1 : 1);

/** Tangentes de la interpolación monótona (equivale a `type="monotone"` de Recharts). */
const monotoneTangents = (points: Point[]): number[] => {
  const count = points.length;
  const slopes: number[] = [];
  const tangents: number[] = new Array(count).fill(0);

  for (let i = 0; i < count - 1; i += 1) {
    const [x0, y0] = points[i];
    const [x1, y1] = points[i + 1];
    slopes.push((y1 - y0) / (x1 - x0 || 1));
  }

  tangents[0] = slopes[0];
  tangents[count - 1] = slopes[count - 2];

  for (let i = 1; i < count - 1; i += 1) {
    const previous = slopes[i - 1];
    const next = slopes[i];
    const h0 = points[i][0] - points[i - 1][0];
    const h1 = points[i + 1][0] - points[i][0];
    const weighted = (previous * h1 + next * h0) / (h0 + h1);

    tangents[i] =
      (sign(previous) + sign(next)) *
        Math.min(Math.abs(previous), Math.abs(next), 0.5 * Math.abs(weighted)) || 0;
  }

  return tangents;
};

const buildLinePath = (points: Point[]): string => {
  if (points.length === 1) {
    return `M${points[0][0]},${points[0][1]}`;
  }

  if (points.length === 2) {
    return `M${points[0][0]},${points[0][1]} L${points[1][0]},${points[1][1]}`;
  }

  const tangents = monotoneTangents(points);
  let path = `M${points[0][0].toFixed(2)},${points[0][1].toFixed(2)}`;

  for (let i = 0; i < points.length - 1; i += 1) {
    const [x0, y0] = points[i];
    const [x1, y1] = points[i + 1];
    const dx = (x1 - x0) / 3;

    path +=
      ` C${(x0 + dx).toFixed(2)},${(y0 + dx * tangents[i]).toFixed(2)}` +
      ` ${(x1 - dx).toFixed(2)},${(y1 - dx * tangents[i + 1]).toFixed(2)}` +
      ` ${x1.toFixed(2)},${y1.toFixed(2)}`;
  }

  return path;
};

const escapeXml = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

export const buildViewsAreaChartSvg = (
  buckets: OwnerDashboardViewsBucket[],
  granularity: OwnerDashboardGranularity,
  width = 640,
  height = 250,
): string => {
  const maxValue = Math.max(...buckets.map((bucket) => bucket.count), 0);
  const step = niceStep(maxValue, Y_TICK_COUNT);
  const yMax = Math.max(step * Math.ceil(maxValue / step), step);
  const yTicks = Array.from({ length: Math.round(yMax / step) + 1 }, (_, i) => i * step);

  const longestTick = Math.max(...yTicks.map((tick) => formatNumber(tick).length));
  const margin = { top: 10, right: 14, bottom: 28, left: 12 + longestTick * 6.4 };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;
  const baseline = margin.top + plotHeight;

  const xAt = (index: number): number =>
    buckets.length === 1
      ? margin.left + plotWidth / 2
      : margin.left + (index * plotWidth) / (buckets.length - 1);
  const yAt = (value: number): number => margin.top + plotHeight - (value / yMax) * plotHeight;

  const points: Point[] = buckets.map((bucket, index) => [xAt(index), yAt(bucket.count)]);
  const linePath = buildLinePath(points);
  const areaPath = `${linePath} L${points[points.length - 1][0].toFixed(2)},${baseline} L${points[0][0].toFixed(2)},${baseline} Z`;

  const grid = yTicks
    .map((tick) => {
      const y = yAt(tick).toFixed(2);
      const dash = tick === 0 ? "" : ' stroke-dasharray="3 3"';

      return (
        `<line x1="${margin.left}" x2="${width - margin.right}" y1="${y}" y2="${y}" stroke="${GRID_COLOR}"${dash}/>` +
        `<text x="${margin.left - 8}" y="${(yAt(tick) + 3.5).toFixed(2)}" text-anchor="end" fill="${TICK_COLOR}" font-size="10.5">${formatNumber(tick)}</text>`
      );
    })
    .join("");

  const labelEvery = Math.max(1, Math.ceil(buckets.length / MAX_X_LABELS));
  const lastIndex = buckets.length - 1;
  const lastRegularLabel = lastIndex - (lastIndex % labelEvery);
  const showLastLabel = lastIndex - lastRegularLabel >= Math.ceil(labelEvery / 2);
  const xLabels = buckets
    .map((bucket, index) => {
      const isLast = showLastLabel && index === lastIndex;

      if (index % labelEvery !== 0 && !isLast) {
        return "";
      }

      const anchor = isLast ? "end" : index === 0 && buckets.length > 1 ? "start" : "middle";
      const label = escapeXml(formatBucketDate(bucket.bucket_start, granularity));

      return `<text x="${xAt(index).toFixed(2)}" y="${height - 8}" text-anchor="${anchor}" fill="${TICK_COLOR}" font-size="10.5">${label}</text>`;
    })
    .join("");

  const marker =
    buckets.length === 1
      ? `<circle cx="${points[0][0]}" cy="${points[0][1]}" r="3.5" fill="${CHART_COLOR}"/>`
      : "";

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="100%" role="img" aria-label="Vistas de tus anuncios" font-family="Inter, Helvetica, Arial, sans-serif">` +
    `<defs><linearGradient id="viewsFill" x1="0" y1="0" x2="0" y2="1">` +
    `<stop offset="5%" stop-color="${CHART_COLOR}" stop-opacity="0.35"/>` +
    `<stop offset="95%" stop-color="${CHART_COLOR}" stop-opacity="0.02"/>` +
    `</linearGradient></defs>` +
    grid +
    `<path d="${areaPath}" fill="url(#viewsFill)"/>` +
    `<path d="${linePath}" fill="none" stroke="${CHART_COLOR}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>` +
    marker +
    xLabels +
    `</svg>`
  );
};
