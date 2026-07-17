import { IsUUID } from "class-validator";

export class FindTicketHttpDto {
  @IsUUID("4")
  id: string;
}
