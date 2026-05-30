import { IsNotEmpty, IsOptional, IsString, IsUUID } from "class-validator";

export class UpdateTicketCategoryHttpDto {
  @IsNotEmpty()
  @IsUUID("4")
  id: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;
}
