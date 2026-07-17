import { IsEmail, IsOptional, IsString, MinLength } from "class-validator";

export class CreatePlanLeadRequestHttpDto {
  @IsString()
  @MinLength(1)
  name!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(1)
  phone!: string;

  @IsOptional()
  @IsString()
  message?: string;
}
