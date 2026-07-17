import { IsUUID } from "class-validator";

export class DeleteTicketCategoryHttpDto {
  @IsUUID("4")
  id: string;
}
