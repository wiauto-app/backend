import { IsNotEmpty, IsString } from "class-validator";


export class CreateDealershipInvitationHttpDto {
  @IsString()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  role: string;

  @IsString()
  @IsNotEmpty()
  dealership_id: string;
}