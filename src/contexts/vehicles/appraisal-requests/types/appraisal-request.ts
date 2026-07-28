import { TransmissionType } from "../../types/vehicle";

export const APPRAISAL_REQUEST_STATUS = {
  PENDING: "pending",
  ANSWERED: "answered",
  CLOSED: "closed",
} as const;

export type AppraisalRequestStatus =
  (typeof APPRAISAL_REQUEST_STATUS)[keyof typeof APPRAISAL_REQUEST_STATUS];

export const APPRAISAL_REQUEST_PRIORITY = {
  LOW: "low",
  HIGH: "high",
} as const;

export type AppraisalRequestPriority =
  (typeof APPRAISAL_REQUEST_PRIORITY)[keyof typeof APPRAISAL_REQUEST_PRIORITY];

export interface AppraisalRequestListItem {
  id: string;
  make_id: number;
  make_name: string;
  model_id: number;
  model_name: string;
  year_id: number;
  year: number;
  version_id: number | null;
  version_name: string | null;
  fuel_type_id: number | null;
  body_type_id: number | null;
  transmission_type: TransmissionType;
  mileage: number;
  lat: number;
  lng: number;
  address: string | null;
  vehicle_label: string;
  name: string;
  email: string;
  phone_code: string;
  phone: string;
  contact_label: string;
  status: AppraisalRequestStatus;
  priority: AppraisalRequestPriority;
  profile_id: string | null;
  estimated_price_min: number | null;
  estimated_price_max: number | null;
  admin_note: string | null;
  answered_at: Date | null;
  created_at: Date;
  updated_at: Date;
}
