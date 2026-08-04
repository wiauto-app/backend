export type SellerContactChannelType =
  | "wiauto_chat"
  | "whatsapp"
  | "phone"
  | "email";

export interface SellerContactChannel {
  type: SellerContactChannelType;
  label: string;
  value: string;
  href?: string;
  publisher_profile_id?: string;
  vehicle_id?: string;
  vehicle_ref?: number;
}

export interface SellerContactVehicleSummary {
  id: string;
  ref: number;
  title: string;
  price: number;
  mileage: number;
  year: number | null;
}

export interface PrepareSellerContactResult {
  channels: SellerContactChannel[];
  suggested_message: string;
  recommended_questions: string[];
  vehicle_summary: SellerContactVehicleSummary;
}
