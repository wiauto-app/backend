import { IsNotEmpty, IsUUID } from "class-validator";

export class CreateUserBlockHttpDto {
  @IsUUID("4")
  @IsNotEmpty()
  blocked_profile_id: string;
}
