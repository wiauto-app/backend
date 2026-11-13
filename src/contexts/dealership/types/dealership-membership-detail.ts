export interface DealershipMembershipDetail {
  dealership_id: string;
  dealership_name: string;
  member_id: string;
  role: "owner" | "admin" | "member";
  phone_code: string;
  phone: string;
  lat?: number | null;
  lng?: number | null;
}
