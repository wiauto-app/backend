import { IsNotEmpty, IsUUID } from "class-validator";

export class FindReportCategoryHttpDto {
  @IsNotEmpty()
  @IsUUID("4")
  id: string;
}
