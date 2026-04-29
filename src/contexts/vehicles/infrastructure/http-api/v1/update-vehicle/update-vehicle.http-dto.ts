import {
  TRANSMISSION_TYPE,
  TransmissionType,
} from "@/src/contexts/vehicles/domain/entities/vehicle";
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  MinLength,
  ValidateIf,
} from "class-validator";

export class UpdateVehicleHttpDto {
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

  @IsString()
  @IsNotEmpty()
  condition: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  title: string;

  @IsOptional()
  @IsString()
  @MinLength(5)
  description?: string;

  @IsOptional()
  @IsEnum(TRANSMISSION_TYPE)
  transmission_type?: TransmissionType;

  @IsOptional()
  @IsUUID("4")
  traction_id?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  power?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  displacement?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  autonomy?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  battery_capacity?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  time_to_charge?: number;

  @IsOptional()
  @IsString()
  license_plate?: string;

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
  vehicle_type_id?: string | null;

  @IsOptional()
  @ValidateIf((_, v) => v !== null && v !== undefined)
  @IsUUID("4")
  color_id?: string | null;

  @IsOptional()
  @ValidateIf((_, v) => v !== null && v !== undefined)
  @IsUUID("4")
  dgt_label_id?: string | null;

  @IsOptional()
  @ValidateIf((_, v) => v !== null && v !== undefined)
  @IsUUID("4")
  warranty_type_id?: string | null;
}
