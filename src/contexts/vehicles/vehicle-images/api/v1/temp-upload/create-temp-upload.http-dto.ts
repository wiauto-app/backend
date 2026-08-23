import { IsString, IsInt, IsEnum, Min, Max } from "class-validator";

export const ALLOWED_VEHICLE_IMAGE_MIMES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/avif",
] as const;

export type AllowedVehicleImageMime = (typeof ALLOWED_VEHICLE_IMAGE_MIMES)[number];

export class CreateTempUploadHttpDto {
  @IsEnum(ALLOWED_VEHICLE_IMAGE_MIMES, {
    message: "Tipo de archivo no permitido. Solo se aceptan JPEG, PNG, WebP y AVIF",
  })
  mime_type: AllowedVehicleImageMime;

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
