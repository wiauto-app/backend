export class UpdateDealershipMemberRoleDto {
  dealership_id: string;
  member_id: string;
  role: "admin" | "member";
}
