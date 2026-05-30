import { IsIn, IsUUID } from "class-validator";

export class DealershipMemberInputHttpDto {
  @IsUUID("4")
  profile_id: string;

  @IsIn(["owner", "admin", "member"])
  role: "owner" | "admin" | "member";
}
