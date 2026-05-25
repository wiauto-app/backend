import { IsNotEmpty, IsUUID } from "class-validator";

export class FindCategoryHttpDto {
  @IsNotEmpty()
  @IsUUID("4")
  id: string;
}
