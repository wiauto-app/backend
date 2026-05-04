import { IsNotEmpty, IsUUID } from "class-validator";

export class FindOnePermissionDto {
  @IsNotEmpty()
  @IsUUID("4")
  id: string;
}
