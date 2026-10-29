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
  Length,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateIf,
  ValidateNested,
} from "class-validator";
import { VehiclePublishTrackingHttpDto } from "@/src/contexts/analytics/dto/vehicle-publish-tracking.http-dto";
import { VehicleMediaHttpDto } from "./vehicleMedia.http-dto";
import { VehicleImageHttpDto } from "./vehicleImageUploadId.http-dto";

export type VehicleMediaDto = VehicleMediaHttpDto;
export type VehicleImageDto = VehicleImageHttpDto;

export class CreateVehicleDto {
  @IsOptional()
  @IsString({ message: "La referencia debe ser un texto." })
  @MaxLength(50, {
    message: "La referencia no puede tener más de 50 caracteres.",
  })
  ref?: string;

  @IsOptional()
  @ValidateIf((_, v) => v !== null && v !== undefined && v !== "")
  @IsString({ message: "El VIN debe ser un texto." })
  @Length(17, 17, { message: "El VIN debe tener 17 caracteres." })
  @Matches(/^[A-HJ-NPR-Z0-9]{17}$/, {
    message: "El VIN debe tener exactamente 17 caracteres válidos.",
  })
  vin_code?: string;

  @IsOptional()
  @ValidateIf((_, v) => v !== null && v !== undefined && v !== "")
  @IsUUID("4", { message: "Selecciona un tipo de vehículo válido." })
  vehicle_type_id?: string | null;

  @IsOptional()
  @ValidateIf((_, v) => v !== null && v !== undefined)
  @IsUUID("4", { message: "Selecciona una categoría válida." })
  category_id?: string | null;

  @IsNumber({}, { message: "El precio debe ser un número." })
  @IsNotEmpty({ message: "Introduce el precio." })
  @Min(0, { message: "El precio no puede ser negativo." })
  @Max(9_999_999, { message: "El precio no puede ser mayor a 9999999." })
  price: number;

  @IsNumber({}, { message: "El kilometraje debe ser un número." })
  @IsNotEmpty({ message: "Introduce el kilometraje." })
  @Min(0, { message: "El kilometraje no puede ser negativo." })
  @Max(9_999_999, {
    message: "El kilometraje no puede ser mayor a 9999999.",
  })
  mileage: number;

  @IsNumber({}, { message: "La ubicación no es válida." })
  @IsNotEmpty({ message: "Selecciona una ubicación en el mapa." })
  lat: number;

  @IsNumber({}, { message: "La ubicación no es válida." })
  @IsNotEmpty({ message: "Selecciona una ubicación en el mapa." })
  lng: number;

  @IsEnum(CONDITION_VEHICLE, {
    message: "Selecciona si el vehículo es nuevo o usado.",
  })
  @IsNotEmpty({ message: "Indica el estado del vehículo." })
  condition: ConditionVehicle;

  @IsOptional()
  @IsString({ message: "La descripción debe ser un texto." })
  @MaxLength(3000, {
    message: "La descripción no puede tener más de 3000 caracteres.",
  })
  description?: string;

  @IsNumber({}, { message: "La versión del catálogo no es válida." })
  @IsNotEmpty({ message: "Selecciona una versión del catálogo." })
  version_id: number;

  @IsString({ message: "El prefijo telefónico no es válido." })
  @IsNotEmpty({ message: "Introduce el prefijo telefónico." })
  @MaxLength(4, {
    message: "El prefijo telefónico no puede tener más de 4 caracteres.",
  })
  phone_code: string;

  @IsString({ message: "El teléfono no es válido." })
  @IsNotEmpty({ message: "Introduce un número de teléfono." })
  @MaxLength(9, { message: "El teléfono no puede tener más de 9 dígitos." })
  phone: string;

  @IsOptional()
  @IsBoolean({ message: "Indica si el teléfono tiene WhatsApp." })
  has_whatsapp?: boolean;

  @IsOptional()
  @IsBoolean({ message: "Indica si quieres mostrar el teléfono." })
  show_phone?: boolean;

  @IsEmail({}, { message: "Introduce un correo electrónico válido." })
  @IsNotEmpty({ message: "Introduce un correo electrónico." })
  email: string;

  @IsOptional()
  @IsEnum(PUBLISHER_TYPE, {
    message: "Selecciona si publicas como particular o profesional.",
  })
  publisher_type?: PublisherType;

  @IsEnum(TRANSMISSION_TYPE, {
    message: "Selecciona un tipo de transmisión.",
  })
  @IsNotEmpty({ message: "Indica el tipo de transmisión." })
  transmission_type: TransmissionType;

  @IsOptional()
  @IsUUID("4", { message: "El tipo de tracción no es válido." })
  traction_id?: string;

  @IsOptional()
  @IsNumber({}, { message: "Introduce la potencia en CV." })
  @Min(1, { message: "La potencia debe ser de al menos 1 CV." })
  @Max(9999, { message: "La potencia no puede ser mayor a 9999 CV." })
  power?: number;

  @IsOptional()
  @IsNumber({}, { message: "Introduce la cilindrada en cc." })
  @Min(0, { message: "La cilindrada no puede ser negativa." })
  @Max(20_000, { message: "La cilindrada no puede ser mayor a 20000 cc." })
  displacement?: number;

  @IsOptional()
  @ValidateIf((_, v) => v !== null && v !== undefined)
  @IsNumber({}, { message: "Introduce la autonomía en km." })
  @Min(0, { message: "La autonomía no puede ser negativa." })
  @Max(2000, { message: "La autonomía no puede ser mayor a 2000 km." })
  autonomy?: number;

  @IsOptional()
  @ValidateIf((_, v) => v !== null && v !== undefined)
  @IsNumber({}, { message: "Introduce la capacidad de la batería en kWh." })
  @Min(0, { message: "La capacidad de la batería no puede ser negativa." })
  @Max(500, {
    message: "La capacidad de la batería no puede ser mayor a 500 kWh.",
  })
  battery_capacity?: number;

  @IsOptional()
  @ValidateIf((_, v) => v !== null && v !== undefined)
  @IsNumber({}, { message: "Introduce el tiempo de carga en horas." })
  @Min(0, { message: "El tiempo de carga no puede ser negativo." })
  @Max(100, { message: "El tiempo de carga no puede ser mayor a 100 h." })
  time_to_charge?: number;

  @IsOptional()
  @ValidateIf((_, v) => v !== null && v !== undefined && v !== "")
  @IsString({ message: "La matrícula debe ser un texto." })
  @Matches(/^\d{4}[A-Z]{3}$/, {
    message: "La matrícula debe tener el formato 1234ABC.",
  })
  license_plate?: string;

  @IsOptional()
  @ValidateIf((_, v) => v !== null && v !== undefined && v !== "")
  @IsNumber({}, { message: "El precio financiado debe ser un número." })
  @Min(0, { message: "El precio financiado no puede ser negativo." })
  @Max(9_999_999, {
    message: "El precio financiado no puede ser mayor a 9999999.",
  })
  finance_price?: number;

  @IsBoolean({ message: "Indica si quieres mostrar la ubicación exacta." })
  show_exact_location?: boolean;

  @IsOptional()
  @IsBoolean({ message: "Indica si quieres ofrecer financiación." })
  offer_financing?: boolean;

  @IsOptional()
  @IsArray({ message: "El equipamiento seleccionado no es válido." })
  @IsUUID("4", {
    each: true,
    message: "Algún elemento del equipamiento no es válido.",
  })
  features_ids?: string[];

  @IsOptional()
  @IsArray({ message: "Los servicios seleccionados no son válidos." })
  @IsUUID("4", {
    each: true,
    message: "Algún servicio seleccionado no es válido.",
  })
  services_ids?: string[];

  @IsOptional()
  @ValidateIf((_, v) => v !== null && v !== undefined)
  @IsUUID("4", { message: "Selecciona un color válido." })
  color_id?: string | null;

  @IsOptional()
  @ValidateIf((_, v) => v !== null && v !== undefined)
  @IsUUID("4", { message: "Selecciona una etiqueta DGT válida." })
  dgt_label_id?: string | null;

  @IsOptional()
  @IsArray({ message: "Las cuotas seleccionadas no son válidas." })
  @IsUUID("4", {
    each: true,
    message: "Alguna cuota seleccionada no es válida.",
  })
  cuota_ids?: string[];

  @IsOptional()
  @ValidateIf((_, v) => v !== null && v !== undefined)
  @IsUUID("4", { message: "Selecciona un tipo de garantía válido." })
  warranty_type_id?: string | null;

  @IsBoolean({ message: "Indica si quieres mostrar la primera cuota." })
  show_first_cuota?: boolean;

  @IsBoolean({ message: "Indica si el vehículo tiene garantía de marca." })
  by_brand_warranty?: boolean;

  @IsOptional()
  @IsBoolean({ message: "Indica si quieres colaborar con reseñas." })
  show_review_collab?: boolean;

  @IsOptional()
  @ValidateIf((_, v) => v !== null && v !== undefined && v !== "")
  @IsNumber({}, { message: "La primera cuota debe ser un número." })
  first_cuota?: number;

  @IsOptional()
  @IsArray({ message: "Las fotos no son válidas." })
  @ValidateNested({ each: true, message: "Alguna foto no es válida." })
  @Type(() => VehicleImageHttpDto)
  images?: VehicleImageHttpDto[];

  @IsOptional()
  @IsArray({ message: "Los vídeos no son válidos." })
  @ValidateNested({ each: true, message: "Algún vídeo no es válido." })
  @Type(() => VehicleMediaHttpDto)
  videos?: VehicleMediaHttpDto[];

  @IsOptional()
  @ValidateNested({ message: "Los datos de seguimiento no son válidos." })
  @Type(() => VehiclePublishTrackingHttpDto)
  tracking?: VehiclePublishTrackingHttpDto;
}
