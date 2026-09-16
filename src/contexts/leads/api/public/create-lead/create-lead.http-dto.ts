import {
  IsEmail,
  IsObject,
  IsOptional,
  IsString,
  MinLength,
} from "class-validator";

export class CreateGenericLeadHttpDto {
  @IsString()
  @MinLength(1)
  type!: string;

  @IsString()
  @MinLength(1)
  first_name!: string;

  @IsString()
  @MinLength(1)
  last_name!: string;

  @IsOptional()
  @IsString()
  dni?: string;

  @IsString()
  @MinLength(1)
  phone!: string;

  @IsEmail()
  email!: string;

  @IsOptional()
  @IsObject()
  extra_data?: Record<string, unknown>;
}
