import { Type } from "class-transformer";
import {
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from "class-validator";

import type { HeroFacetKind } from "../../../types/hero-facet-item";

const HERO_FACET_KINDS = [
  "makes",
  "models",
  "provinces",
  "municipalities",
  "price_ranges",
] as const satisfies readonly HeroFacetKind[];

export class HeroFacetsHttpDto {
  @IsEnum(HERO_FACET_KINDS)
  facet!: HeroFacetKind;

  @IsOptional()
  @IsString()
  search?: string;

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
