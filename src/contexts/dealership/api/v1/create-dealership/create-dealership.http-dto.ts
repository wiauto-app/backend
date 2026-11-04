import { Transform, Type } from "class-transformer";
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  ValidateNested,
} from "class-validator";

const emptyStringToUndefined = ({ value }: { value: unknown }) =>
  typeof value === "string" && value.trim() === "" ? undefined : value;

import { DealershipMemberInputHttpDto } from "../dealership-member-input/dealership-member-input.http-dto";

export class CreateDealershipHttpDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  avatar_url: string;

  @IsString()
  @IsNotEmpty()
  banner_url: string;

  @IsOptional()
  @Transform(emptyStringToUndefined)
  @IsString()
  description?: string;

  @IsOptional()
  @Transform(emptyStringToUndefined)
  @IsUrl(
    { require_protocol: false },
    { message: "Introduce una URL o dominio válido" },
  )
  website_url?: string;

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

  @IsOptional()
  @IsBoolean()
  show_phone?: boolean;

  @IsOptional()
  @IsNumber()
  max_listings?: number;

  @IsOptional()
  @IsNumber()
  max_photos?: number;

  @IsOptional()
  @IsBoolean()
  allow_videos?: boolean;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => DealershipMemberInputHttpDto)
  members: DealershipMemberInputHttpDto[];
}
