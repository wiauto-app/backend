import { PrimitiveDealership } from "./dealership";
import { DealershipScheduleDayDto } from "./dealership-schedule";

export interface DealershipMemberProfileSummary {
  id: string;
  name: string;
  last_name?: string;
  avatar_url?: string;
  email: string;
}

export interface DealershipMemberDetail {
  id: string;
  dealership_id: string;
  profile_id: string;
  role: "owner" | "admin" | "member";
  created_at: Date;
  updated_at: Date;
  profile: DealershipMemberProfileSummary;
}

export interface DealershipDetail extends PrimitiveDealership {
  members: DealershipMemberDetail[];
  schedules: DealershipScheduleDayDto[];
}
