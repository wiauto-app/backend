import { IsNotEmpty, IsUUID } from "class-validator";

export class FindReportHttpDto {
  @IsNotEmpty()
  @IsUUID("4")
  id: string;
}
