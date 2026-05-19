import { IsNotEmpty, IsUUID } from "class-validator";

export class UnsuspendUserBodyDto {
  @IsUUID("4")
  @IsNotEmpty()
  target_user_id: string;
}