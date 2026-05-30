import { IsUUID } from "class-validator";

export class FindTicketCategoryHttpDto {
  @IsUUID("4")
  id: string;
}
