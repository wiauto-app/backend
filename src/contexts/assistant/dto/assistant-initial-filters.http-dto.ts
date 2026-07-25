import {
  PUBLISHER_TYPE,
  TRANSMISSION_TYPE,
} from "@/src/contexts/vehicles/types/vehicle";
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from "class-validator";

export class AssistantInitialFiltersHttpDto {
  @IsOptional()
  @IsString()
  type_slug?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  makes_slugs?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  models_slugs?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categories_slugs?: string[];

  @IsOptional()
  @IsNumber()
  @Min(0)
  since_price?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  until_price?: number;

  @IsOptional()
  @IsBoolean()
  price_offer?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  service_slugs?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  provinces_slugs?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  comunities_slugs?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  municipalities_slugs?: string[];

  @IsOptional()
  @IsNumber()
  lat?: number;

  @IsOptional()
  @IsNumber()
  lng?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  radius?: number;

  @IsOptional()
  @IsArray()
  @IsIn(Object.values(PUBLISHER_TYPE), { each: true })
  publisher_types?: Array<
    (typeof PUBLISHER_TYPE)[keyof typeof PUBLISHER_TYPE]
  >;

  @IsOptional()
  @IsBoolean()
  is_seller_featured?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  warranty_slugs?: string[];

  @IsOptional()
  @IsNumber()
  since_year?: number;

  @IsOptional()
  @IsNumber()
  until_year?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  since_mileage?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  until_mileage?: number;

  @IsOptional()
  @IsArray()
  @IsIn(Object.values(TRANSMISSION_TYPE), { each: true })
  transmission_types?: Array<
    (typeof TRANSMISSION_TYPE)[keyof typeof TRANSMISSION_TYPE]
  >;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  fuel_type_slugs?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  traction_slugs?: string[];

  @IsOptional()
  @IsNumber()
  @Min(0)
  power_since?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  power_until?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  displacement_since?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  displacement_until?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  dgt_label_ids?: string[];

  @IsOptional()
  @IsNumber()
  @Min(0)
  autonomy_since?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  battery_capacity_since?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  battery_capacity_until?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  time_to_charge?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  features_slugs?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  color_slugs?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  cuota_slugs?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  exclude_vehicle_ids?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  dealership_ids?: string[];
}
