import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
} from "class-validator";

export class CreateFeaturedListingOfferHttpDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  title!: string;

  @IsOptional()
  @IsString()
  description?: string | null;

  @IsInt()
  @Min(1)
  duration_days!: number;

  @IsInt()
  @Min(1)
  @Max(100)
  boost_weight!: number;

  @IsInt()
  @Min(1)
  amount_cents!: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @IsOptional()
  @IsInt()
  sort_order?: number;
}
