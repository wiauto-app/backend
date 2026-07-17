import type { OwnerVehicleStatTrend } from "./owner-vehicle-list-item";

export type OwnerDashboardPeriodCode = "7d" | "30d" | "90d";

export interface OwnerDashboardPeriod {
  days: number;
  start: string;
  end: string;
}

export interface OwnerDashboardSummary {
  active_stock: OwnerVehicleStatTrend;
  views: OwnerVehicleStatTrend;
  leads: OwnerVehicleStatTrend;
  sales_value: OwnerVehicleStatTrend;
}

export interface OwnerDashboardViewsBucket {
  bucket_start: string;
  count: number;
}

export interface OwnerDashboardWeeklyActivity {
  visits: number;
  messages_received: number;
}

export interface OwnerDashboardOpportunities {
  unread_messages: number;
}

export interface OwnerDashboardStockAgeBucket {
  label: string;
  count: number;
  percentage: number;
}

export type OwnerDashboardQualityTier = "high" | "medium" | "low";

export interface OwnerDashboardQualityBucket {
  tier: OwnerDashboardQualityTier;
  label: string;
  count: number;
}

export interface OwnerDashboardPriceDeviationItem {
  vehicle_id: string;
  display_name: string;
  price: number;
  benchmark_price: number;
  deviation_percent: number;
}

export interface OwnerDashboardPriceDeviation {
  above_market: OwnerDashboardPriceDeviationItem[];
  below_market: OwnerDashboardPriceDeviationItem[];
}

export interface OwnerDashboardInventory {
  active_count: number;
  stock_age_buckets: OwnerDashboardStockAgeBucket[];
  quality_distribution: OwnerDashboardQualityBucket[];
  price_deviation: OwnerDashboardPriceDeviation;
}

export interface OwnerDashboardDealership {
  name: string;
  phone_code: string | null;
  phone: string | null;
  rating: number | null;
  reviews_count: number;
}

export interface OwnerDashboardSupport {
  phone: string;
  faq_url: string;
}

export interface OwnerDashboard {
  period: OwnerDashboardPeriod;
  summary: OwnerDashboardSummary;
  views_time_series: OwnerDashboardViewsBucket[];
  weekly_activity: OwnerDashboardWeeklyActivity;
  opportunities: OwnerDashboardOpportunities;
  inventory: OwnerDashboardInventory;
  dealership: OwnerDashboardDealership | null;
  support: OwnerDashboardSupport;
}

export interface OwnerDashboardSummaryRaw {
  active_stock_current: number;
  active_stock_previous: number;
  views_current: number;
  views_previous: number;
  leads_current: number;
  leads_previous: number;
  sales_value_current: number;
  sales_value_previous: number;
}

export interface OwnerDashboardInventoryVehicleRow {
  vehicle_id: string;
  display_name: string;
  price: number;
  model_id: number;
  image_count: number;
  description_length: number;
  mileage: number;
  is_featured: boolean;
  featured_expires_at: Date | null;
  listing_age_days: number;
}

export interface OwnerDashboardPriceDeviationRow {
  vehicle_id: string;
  display_name: string;
  price: number;
  benchmark_price: number;
  deviation_percent: number;
}
