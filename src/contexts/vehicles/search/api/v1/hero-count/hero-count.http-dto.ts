import { Type } from "class-transformer";
import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from "class-validator";

export class HeroCountHttpDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  make_slugs?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  model_slugs?: string[];

  @IsOptional()
  @IsString()
  province_slug?: string;

  @IsOptional()
  @IsString()
  municipality_slug?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  until_price?: number;
}
