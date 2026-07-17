import { PaginationHttpDto } from "@/src/contexts/shared/dto/pagination.http-dto";
import {
  PublisherType,
  PUBLISHER_TYPE,
  TransmissionType,
  TRANSMISSION_TYPE,
} from "@/src/contexts/vehicles/types/vehicle";
import {
  OptionalPositiveInt,
  OptionalQueryStringArray,
} from "@/src/contexts/vehicles/validators/filter.validator";
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

  @OptionalQueryStringArray()
  makes_slugs: string[] = [];

  @OptionalQueryStringArray()
  models_slugs: string[] = [];

  @OptionalQueryStringArray()
  categories_slugs: string[] = [];

  @IsOptional()
  @IsNumber()
  @Min(0)
  since_price: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  until_price: number;

  @IsOptional()
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
  @IsNumber()
  lat: number;

  @IsOptional()
  @IsNumber()
  lng: number;

  @OptionalPositiveInt()
  radius: number;

  @IsOptional()
  @IsArray()
  @IsIn(Object.values(PUBLISHER_TYPE), { each: true })
  publisher_types: PublisherType[] = [];

  @IsOptional()
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

  @OptionalQueryStringArray()
  exclude_vehicle_ids: string[] = [];

  @OptionalQueryStringArray()
  dealership_ids: string[] = [];
}

