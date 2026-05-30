import { IsNotEmpty, IsString } from "class-validator";

export class CreateTicketCategoryHttpDto {
  @IsString()
  @IsNotEmpty()
  name: string;
}
