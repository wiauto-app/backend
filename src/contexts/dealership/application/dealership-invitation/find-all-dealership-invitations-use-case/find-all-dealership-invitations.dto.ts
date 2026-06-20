export class FindAllDealershipInvitationsDto {
  dealership_id: string;
  status?: "pending" | "accepted" | "revoked" | "expired";
  page?: number;
  limit?: number;
}
