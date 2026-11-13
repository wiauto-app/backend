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

const VIDEO_NOT_UPLOADED_MESSAGE =
  "El vídeo no se ha subido correctamente. Vuelve a añadirlo.";

const hasValue = (value: unknown): boolean =>
  value !== undefined && value !== null && value !== "";

/**
 * Vídeo de un anuncio. Exactamente uno de:
 * - `upload_id`: sesión multipart completada (`/v1/vehicle-videos/uploads`).
 * - `id`: vídeo ya existente del vehículo (solo en actualización).
 * - `path`: legacy, ruta temporal subida con URL firmada simple.
 *   @deprecated se mantiene para builds móviles anteriores.
 */
export class VehicleVideoHttpDto {
  @ValidateIf((o: VehicleVideoHttpDto) => !hasValue(o.id) && !hasValue(o.path))
  @IsUUID("4", { message: VIDEO_NOT_UPLOADED_MESSAGE })
  @IsNotEmpty({ message: "Falta la referencia de subida del vídeo." })
  upload_id?: string;

  @ValidateIf((o: VehicleVideoHttpDto) => hasValue(o.id))
  @IsUUID("4", { message: "El vídeo no es válido." })
  id?: string;

  @ValidateIf(
    (o: VehicleVideoHttpDto) => hasValue(o.path) && !hasValue(o.upload_id),
  )
  @IsString({ message: "La ruta del vídeo no es válida." })
  @MinLength(1, { message: "La ruta del vídeo no puede estar vacía." })
  @IsTempStoragePath({ message: VIDEO_NOT_UPLOADED_MESSAGE })
  path?: string;

  @IsNumber({}, { message: "El orden del vídeo debe ser un número." })
  @IsNotEmpty({ message: "Indica el orden del vídeo." })
  @Min(0, { message: "El orden del vídeo no puede ser negativo." })
  @Max(100, { message: "El orden del vídeo no puede ser mayor a 100." })
  order: number;
}

/** @deprecated Usar VehicleVideoHttpDto */
export class VehicleMediaHttpDto extends VehicleVideoHttpDto {}

export type VehicleVideoKind =
  | { kind: "upload"; upload_id: string; order: number }
  | { kind: "existing"; id: string; order: number }
  | { kind: "legacy"; path: string; order: number };

/** Clasifica un vídeo del payload (prioridad: upload_id > id > path). */
export const classifyVehicleVideo = (
  video: VehicleVideoHttpDto,
): VehicleVideoKind => {
  if (video.upload_id) {
    return { kind: "upload", upload_id: video.upload_id, order: video.order };
  }
  if (video.id) {
    return { kind: "existing", id: video.id, order: video.order };
  }
  if (video.path) {
    return { kind: "legacy", path: video.path, order: video.order };
  }
  throw new Error("Vídeo sin upload_id, id ni path");
};
