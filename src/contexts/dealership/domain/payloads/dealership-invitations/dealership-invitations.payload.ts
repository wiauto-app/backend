
export class CreateDealershipInvitationPayload {
  email: string;
  role: "owner" | "admin" | "member";
  token_hash: string;
  status: "pending" | "accepted" | "revoked" | "expired";
  expires_at: Date;
  accepted_at: Date | null;
  dealership_id: string;
  invited_by_id: string;
}