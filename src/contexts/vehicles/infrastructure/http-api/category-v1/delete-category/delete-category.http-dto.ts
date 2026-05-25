import { IsNotEmpty, IsUUID } from "class-validator";

export class DeleteCategoryHttpDto {
  @IsNotEmpty()
  @IsUUID("4")
  id: string;
}
