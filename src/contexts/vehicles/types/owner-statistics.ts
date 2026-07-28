export type OwnerStatisticsGranularity = "day" | "week" | "month";

export interface OwnerStatisticsReach {
  listings_published: number;
  impressions: number;
  visits: number;
  contacts: number;
}

export interface OwnerStatisticsActions {
  favorites: number;
  shares: number;
  response_rate_percent: number | null;
  median_response_time_minutes: number | null;
}

export interface OwnerStatisticsTimeSeriesBucket {
  bucket_start: string;
  impressions: number;
  visits: number;
  messages: number;
  listings_published: number;
}

export interface OwnerStatisticsPeriod {
  since: string;
  until: string;
  granularity: OwnerStatisticsGranularity;
}

export interface OwnerStatisticsResult {
  period: OwnerStatisticsPeriod;
  reach: OwnerStatisticsReach;
  actions: OwnerStatisticsActions;
  time_series: OwnerStatisticsTimeSeriesBucket[];
}

export interface OwnerStatisticsReachCountsRaw {
  listings_published: number;
  impressions: number;
  visits: number;
  leads: number;
  contact_clicks: number;
  favorites: number;
  shares: number;
}

export interface OwnerStatisticsResponseRateRaw {
  chats_with_incoming: number;
  chats_with_response: number;
  median_response_minutes: number | null;
}

export interface OwnerStatisticsTimeSeriesRow {
  bucket_start: string;
  impressions: number;
  visits: number;
  messages: number;
  listings_published: number;
}
