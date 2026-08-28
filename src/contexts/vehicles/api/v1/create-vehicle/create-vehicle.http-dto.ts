import {
  PUBLISHER_TYPE,
  PublisherType,
  CONDITION_VEHICLE,
  TRANSMISSION_TYPE,
  TransmissionType,
  ConditionVehicle,
} from "@/src/contexts/vehicles/types/vehicle";
import { Type } from "class-transformer";
import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  MinLength,
  ValidateIf,
  ValidateNested,
} from "class-validator";
import { VehicleMediaHttpDto } from "./vehicleMedia.http-dto";
import { VehicleImageHttpDto } from "./vehicleImageUploadId.http-dto";

export type VehicleMediaDto = VehicleMediaHttpDto;
export type VehicleImageDto = VehicleImageHttpDto;

export class CreateVehicleDto {
  @IsOptional()
  @IsString()
  vin_code?: string;

  @IsOptional()
  @ValidateIf((_, v) => v !== null && v !== undefined && v !== "")
  @IsUUID("4")
  vehicle_type_id?: string | null;

  @IsOptional()
  @ValidateIf((_, v) => v !== null && v !== undefined)
  @IsUUID("4")
  category_id?: string | null;

  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  price: number;

  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  mileage: number;

  @IsNumber()
  @IsNotEmpty()
  lat: number;

  @IsNumber()
  @IsNotEmpty()
  lng: number;

  @IsEnum(CONDITION_VEHICLE)
  @IsNotEmpty()
  condition: ConditionVehicle;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  @IsNotEmpty()
  version_id: number;

  @IsString()
  @IsNotEmpty()
  phone_code: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsOptional()
  @IsBoolean()
  has_whatsapp?: boolean;

  @IsOptional()
  @IsBoolean()
  show_phone?: boolean;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsOptional()
  @IsEnum(PUBLISHER_TYPE)
  publisher_type?: PublisherType;

  @IsEnum(TRANSMISSION_TYPE)
  @IsNotEmpty()
  transmission_type: TransmissionType;

  @IsUUID("4")
  @IsNotEmpty()
  traction_id: string;

  @IsOptional()
  @IsNumber()
  power?: number;

  @IsOptional()
  @IsNumber()
  displacement?: number;

  @IsOptional()
  @ValidateIf((_, v) => v !== null && v !== undefined)
  @IsNumber()
  @Min(0)
  autonomy?: number;

  @IsOptional()
  @ValidateIf((_, v) => v !== null && v !== undefined)
  @IsNumber()
  @Min(0)
  battery_capacity?: number;

  @IsOptional()
  @ValidateIf((_, v) => v !== null && v !== undefined)
  @IsNumber()
  @Min(0)
  time_to_charge?: number;

  @IsOptional()
  @ValidateIf((_, v) => v !== null && v !== undefined && v !== "")
  @IsString()
  @MinLength(5)
  license_plate?: string;

  @IsOptional()
  @ValidateIf((_, v) => v !== null && v !== undefined && v !== "")
  @IsNumber()
  finance_price?: number;

  @IsBoolean()
  show_exact_location?: boolean;

  @IsOptional()
  @IsArray()
  @IsUUID("4", { each: true })
  features_ids?: string[];

  @IsOptional()
  @IsArray()
  @IsUUID("4", { each: true })
  services_ids?: string[];

  @IsOptional()
  @ValidateIf((_, v) => v !== null && v !== undefined)
  @IsUUID("4")
  color_id?: string | null;

  @IsOptional()
  @ValidateIf((_, v) => v !== null && v !== undefined)
  @IsUUID("4")
  dgt_label_id?: string | null;

  @IsOptional()
  @IsArray()
  @IsUUID("4", { each: true })
  cuota_ids?: string[];

  @IsOptional()
  @ValidateIf((_, v) => v !== null && v !== undefined)
  @IsUUID("4")
  warranty_type_id?: string | null;

  @IsBoolean()
  show_first_cuota?: boolean;

  @IsBoolean()
  by_brand_warranty?: boolean;

  @IsOptional()
  @IsBoolean()
  show_review_collab?: boolean;

  @IsOptional()
  @ValidateIf((_, v) => v !== null && v !== undefined && v !== "")
  @IsNumber()
  first_cuota?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VehicleImageHttpDto)
  images?: VehicleImageHttpDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VehicleMediaHttpDto)
  videos?: VehicleMediaHttpDto[];
}
