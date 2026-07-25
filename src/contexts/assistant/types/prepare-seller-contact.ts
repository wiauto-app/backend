export interface SellerContactChannel {
  type: "whatsapp" | "phone" | "email";
  label: string;
  value: string;
  href?: string;
}

export interface SellerContactVehicleSummary {
  id: string;
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
