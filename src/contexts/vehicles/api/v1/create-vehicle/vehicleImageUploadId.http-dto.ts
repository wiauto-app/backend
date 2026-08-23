import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  MinLength,
  ValidateIf,
} from "class-validator";

import { IsTempStoragePath } from "@/src/contexts/shared/file/validators/is-temp-storage-path.validator";

/**
 * Imagen en create-vehicle: flujo async (`upload_id`) o legacy temp (`path`).
 * Exactamente uno de los dos es obligatorio.
 */
export class VehicleImageHttpDto {
  @ValidateIf((o: VehicleImageHttpDto) => !o.path)
  @IsUUID("4")
  @IsNotEmpty()
  upload_id?: string;

  @ValidateIf((o: VehicleImageHttpDto) => !o.upload_id)
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @IsTempStoragePath()
  path?: string;

  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  @Max(100)
  order: number;
}

/** @deprecated Usar VehicleImageHttpDto */
export class VehicleImageUploadIdHttpDto extends VehicleImageHttpDto {}
