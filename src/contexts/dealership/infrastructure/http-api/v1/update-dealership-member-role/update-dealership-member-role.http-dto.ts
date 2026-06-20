import { IsIn, IsNotEmpty, IsString } from "class-validator";

export class UpdateDealershipMemberRoleHttpDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(["admin", "member"])
  role: "admin" | "member";
}
