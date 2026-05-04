import {
  PUBLISHER_TYPE,
  PublisherType,
  CONDITION_VEHICLE,
  TRANSMISSION_TYPE,
  TransmissionType,
  ConditionVehicle,
} from "@/src/contexts/vehicles/domain/entities/vehicle";
import {
  IsArray,
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
} from "class-validator";

export class CreateVehicleHttpDto {
  @IsUUID("4")
  vehicle_type_id: string;

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

  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  title: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  description: string;

  @IsNumber()
  @IsNotEmpty()
  version_id: number;

  @IsString()
  @IsNotEmpty()
  phone_code: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsEnum(PUBLISHER_TYPE)
  @IsNotEmpty()
  publisher_type: PublisherType;

  @IsOptional()
  @ValidateIf((_, v) => v !== null && v !== undefined)
  @IsEnum(TRANSMISSION_TYPE)
  transmission_type?: TransmissionType;

  @IsUUID("4")
  @IsNotEmpty()
  traction_id: string;

  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  power: number;

  @IsOptional()
  @ValidateIf((_, v) => v !== null && v !== undefined)
  @IsNumber()
  @IsNotEmpty()
  @Min(0)
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
  @ValidateIf((_, v) => v !== null && v !== undefined)
  @IsString()
  @MinLength(5)
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
}
