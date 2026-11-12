import { IsString, IsInt, IsEnum, Min, Max } from "class-validator";

import {
  ALLOWED_VEHICLE_TEMP_UPLOAD_MIMES,
  type AllowedVehicleTempUploadMime,
} from "@/src/contexts/shared/file/media.constants";

export { ALLOWED_VEHICLE_TEMP_UPLOAD_MIMES };

/** @deprecated Usar ALLOWED_VEHICLE_TEMP_UPLOAD_MIMES */
export const ALLOWED_VEHICLE_IMAGE_MIMES = ALLOWED_VEHICLE_TEMP_UPLOAD_MIMES;

export type AllowedVehicleImageMime = AllowedVehicleTempUploadMime;

const allowed_mimes_hint =
  "JPEG, PNG, WebP, AVIF, HEIC/HEIF, GIF, BMP o TIFF";

export class CreateTempUploadHttpDto {
  @IsEnum(ALLOWED_VEHICLE_TEMP_UPLOAD_MIMES, {
    message: `Tipo de archivo no permitido. Solo se aceptan ${allowed_mimes_hint}`,
  })
  mime_type: AllowedVehicleTempUploadMime;

  @IsInt()
  @Min(1)
  @Max(10 * 1024 * 1024) // 10MB
  size_bytes: number;

  @IsString()
  original_filename: string;
}

export interface CreateTempUploadResponseDto {
  upload_id: string;
  signed_url: string;
  storage_path: string;
  expires_at: string;
}
