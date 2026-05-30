import { IsNotEmpty, IsOptional, IsString, IsUUID } from "class-validator";

export class CreateTicketHttpDto {
  @IsUUID("4")
  @IsNotEmpty()
  category_id: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsOptional()
  @IsString()
  file_url?: string | null;
}
