import { ReportStatus } from "./report";
import { ReportTargetType } from "./report-category";

export interface ReportCategoryRef {
  id: string;
  name: string;
  slug: string;
  target_type: ReportTargetType;
  created_at: Date;
  updated_at: Date;
}

export interface ReportListItem {
  id: string;
  title: string;
  description: string;
  file_url: string | null;
  status: ReportStatus;
  target_type: ReportTargetType;
  target_id: string;
  target_label: string;
  reporter_profile_id: string;
  reporter_label: string;
  implicated_profile_id: string | null;
  implicated_label: string | null;
  implicated_is_suspended: boolean;
  vehicle_id_for_chat: string | null;
  category: ReportCategoryRef;
  admin_notes: string | null;
  created_at: Date;
  updated_at: Date;
}

export type ReportDetail = ReportListItem;
