import {
  IsNotEmpty,
  IsNumber,
  IsString,
  IsUUID,
  Max,
  Min,
  MinLength,
  ValidateIf,
} from "class-validator";

import { IsTempStoragePath } from "@/src/contexts/shared/file/validators/is-temp-storage-path.validator";

const PHOTO_NOT_UPLOADED_MESSAGE =
  "La foto no se ha subido correctamente. Vuelve a añadirla.";

/**
 * Imagen en create-vehicle: flujo async (`upload_id`) o legacy temp (`path`).
 * Exactamente uno de los dos es obligatorio.
 */
export class VehicleImageHttpDto {
  @ValidateIf((o: VehicleImageHttpDto) => !o.path)
  @IsUUID("4", { message: PHOTO_NOT_UPLOADED_MESSAGE })
  @IsNotEmpty({ message: "Falta la referencia de subida de la foto." })
  upload_id?: string;

  @ValidateIf((o: VehicleImageHttpDto) => !o.upload_id)
  @IsString({ message: "La ruta de la foto no es válida." })
  @IsNotEmpty({ message: "Falta la ruta de la foto." })
  @MinLength(1, { message: "La ruta de la foto no puede estar vacía." })
  @IsTempStoragePath({ message: PHOTO_NOT_UPLOADED_MESSAGE })
  path?: string;

  @IsNumber({}, { message: "El orden de la foto debe ser un número." })
  @IsNotEmpty({ message: "Indica el orden de la foto." })
  @Min(0, { message: "El orden de la foto no puede ser negativo." })
  @Max(100, { message: "El orden de la foto no puede ser mayor a 100." })
  order: number;
}

/** @deprecated Usar VehicleImageHttpDto */
export class VehicleImageUploadIdHttpDto extends VehicleImageHttpDto {}
