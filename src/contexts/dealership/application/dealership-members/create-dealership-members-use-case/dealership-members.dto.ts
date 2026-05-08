

export class CreateDealershipMembersDto {
  dealership_id: string;
  profile_id: string;
  role: "owner" | "admin" | "member";
}