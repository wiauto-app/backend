export type AdminDashboardGranularity = "day" | "week";

export interface AdminDashboardPeriod {
  days: number;
  start: string;
  end: string;
  granularity: AdminDashboardGranularity;
}

export interface AdminDashboardKpiTrend {
  current: number;
  previous: number;
}

export interface AdminDashboardKpis {
  activeVehicles: AdminDashboardKpiTrend;
  pendingVehicles: AdminDashboardKpiTrend;
  newUsers: AdminDashboardKpiTrend;
  leads: AdminDashboardKpiTrend;
  activeSubscriptions: AdminDashboardKpiTrend;
}

export interface AdminDashboardQueues {
  pendingVehicles: number;
  openReports: number;
  pendingAppraisals: number;
  highPriorityAppraisals: number;
  planLeadRequests: number;
  openTickets: number;
}

export interface AdminDashboardTimeSeriesBucket {
  bucketStart: string;
  newUsers: number;
  newVehicles: number;
  views: number;
  impressions: number;
  leads: number;
}

export interface AdminDashboardCommercial {
  subscriptionsByStatus: Record<string, number>;
  appraisalsResolved: number;
  appraisalsPending: number;
}

export interface AdminDashboardResponse {
  period: AdminDashboardPeriod;
  kpis: AdminDashboardKpis;
  queues: AdminDashboardQueues;
  timeSeries: AdminDashboardTimeSeriesBucket[];
  inventoryByStatus: Record<string, number>;
  commercial: AdminDashboardCommercial;
}

export interface AdminDashboardKpisRaw {
  active_vehicles_current: number;
  active_vehicles_previous: number;
  pending_vehicles_current: number;
  pending_vehicles_previous: number;
  new_users_current: number;
  new_users_previous: number;
  leads_current: number;
  leads_previous: number;
  active_subscriptions_current: number;
  active_subscriptions_previous: number;
}

export interface AdminDashboardQueuesRaw {
  pending_vehicles: number;
  open_reports: number;
  pending_appraisals: number;
  high_priority_appraisals: number;
  plan_lead_requests: number;
  open_tickets: number;
}

export interface AdminDashboardCommercialRaw {
  subscriptions_by_status: Record<string, number>;
  appraisals_resolved: number;
  appraisals_pending: number;
}

export interface AdminDashboardTimeSeriesRawRow {
  bucket_start: string;
  new_users: number;
  new_vehicles: number;
  views: number;
  impressions: number;
  leads: number;
}

export interface AdminDashboardDateRangeBounds {
  days: number;
  start: Date;
  end: Date;
  currentStart: Date;
  previousStart: Date;
  periodEnd: Date;
  granularity: AdminDashboardGranularity;
  stepInterval: string;
  startDate: string;
  endDate: string;
}
