import { IsEmail, IsNotEmpty, IsNumber, IsString } from "class-validator";

export class CreateDealershipHttpDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  slug: string;

  @IsString()
  @IsNotEmpty()
  avatar_url: string;

  @IsString()
  @IsNotEmpty()
  banner_url: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsNotEmpty()
  website_url: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  phone_code: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsNotEmpty()
  address: string;

  @IsNumber()
  lat: number;

  @IsNumber()
  lng: number;
}
