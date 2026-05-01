import { PaginationHttpDto } from "@/src/contexts/shared/dto/pagination.http-dto";
import {
  PublisherType,
  PUBLISHER_TYPE,
  TransmissionType,
  TRANSMISSION_TYPE,
} from "@/src/contexts/vehicles/domain/entities/vehicle";
import {
  OptionalPositiveInt,
  OptionalQueryStringArray,
  normalize_optional_boolean,
  normalize_optional_number,
  normalize_query_string_array,
} from "@/src/contexts/vehicles/infrastructure/validators/filter.validator";
import { Transform } from "class-transformer";
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from "class-validator";

export class FindAllVehiclesHttpDto extends PaginationHttpDto {
  @IsOptional()
  @IsString()
  type_slug: string;

  @IsOptional()
  @IsString()
  make_slug: string;

  @IsOptional()
  @IsString()
  model_slug: string;

  @IsOptional()
  @Transform(({ value }) => normalize_optional_number(value))
  @IsNumber()
  @Min(0)
  since_price: number;

  @IsOptional()
  @Transform(({ value }) => normalize_optional_number(value))
  @IsNumber()
  @Min(0)
  until_price: number;

  @IsOptional()
  @Transform(({ value }) => normalize_optional_boolean(value))
  @IsBoolean()
  price_offer: boolean;

  @OptionalQueryStringArray()
  provinces_slugs: string[] = [];

  @OptionalQueryStringArray()
  comunities_slugs: string[] = [];

  @OptionalQueryStringArray()
  municipalities_slugs: string[] = [];

  @OptionalQueryStringArray()
  service_slugs: string[] = [];

  @IsOptional()
  @Transform(({ value }) => normalize_optional_number(value))
  @IsNumber()
  lat: number;

  @IsOptional()
  @Transform(({ value }) => normalize_optional_number(value))
  @IsNumber()
  lng: number;

  @OptionalPositiveInt()
  radius: number;

  @IsOptional()
  @Transform(({ value }) => normalize_query_string_array(value))
  @IsArray()
  @IsIn(Object.values(PUBLISHER_TYPE), { each: true })
  publisher_types: PublisherType[] = [];

  @IsOptional()
  @Transform(({ value }) => normalize_optional_boolean(value))
  @IsBoolean()
  is_seller_featured: boolean;

  @OptionalQueryStringArray()
  warranty_slugs: string[] = [];

  @OptionalPositiveInt()
  since_year: number;

  @OptionalPositiveInt()
  until_year: number;

  @OptionalPositiveInt()
  since_mileage: number;

  @OptionalPositiveInt()
  until_mileage: number;

  @IsOptional()
  @Transform(({ value }) => normalize_query_string_array(value))
  @IsArray()
  @IsIn(Object.values(TRANSMISSION_TYPE), { each: true })
  transmission_types: TransmissionType[] = [];

  @OptionalQueryStringArray()
  fuel_type_slugs: string[] = [];

  @OptionalQueryStringArray()
  traction_slugs: string[] = [];

  @OptionalPositiveInt()
  power_since: number;

  @OptionalPositiveInt()
  power_until: number;

  @OptionalPositiveInt()
  displacement_since: number;

  @OptionalPositiveInt()
  displacement_until: number;

  @OptionalQueryStringArray()
  dgt_label_ids: string[] = [];

  @OptionalPositiveInt()
  autonomy_since: number;

  @OptionalPositiveInt()
  battery_capacity_since: number;

  @OptionalPositiveInt()
  battery_capacity_until: number;

  @OptionalPositiveInt()
  time_to_charge: number;

  @OptionalQueryStringArray()
  features_slugs: string[] = [];

  @OptionalQueryStringArray()
  color_slugs: string[] = [];

  @OptionalQueryStringArray()
  cuota_slugs: string[] = [];
}
