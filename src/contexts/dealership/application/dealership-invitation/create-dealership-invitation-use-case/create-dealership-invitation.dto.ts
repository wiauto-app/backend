

export class CreateDealershipInvitationDto {
  email: string;
  role: "owner" | "admin" | "member";
  dealership_id: string;
  invited_by_id: string;
}