import { IsIn, IsNotEmpty, IsString } from "class-validator";

export class CreateDealershipInvitationHttpDto {
  @IsString()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(["admin", "member"])
  role: "admin" | "member";

  @IsString()
  @IsNotEmpty()
  dealership_id: string;
}
