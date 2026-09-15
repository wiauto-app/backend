import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from "class-validator";

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

  @IsOptional()
  @IsString()
  @MaxLength(120)
  guest_name?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(254)
  guest_email?: string;
}
