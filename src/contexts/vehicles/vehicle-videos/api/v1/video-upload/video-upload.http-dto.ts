import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from "class-validator";

import {
  VEHICLE_VIDEO_MAX_PART_URLS_PER_REQUEST,
  VEHICLE_VIDEO_MAX_SIZE_BYTES,
} from "@/src/contexts/shared/file/media.constants";

/** Límite técnico de S3/R2 multipart. */
const MAX_PARTS = 10_000;

export class InitVideoUploadHttpDto {
  @IsString({ message: "El tipo de vídeo no es válido." })
  @IsNotEmpty({ message: "Indica el tipo de vídeo." })
  @MaxLength(100)
  mime_type: string;

  @Type(() => Number)
  @IsInt({ message: "El tamaño del vídeo no es válido." })
  @Min(1, { message: "El vídeo está vacío." })
  @Max(VEHICLE_VIDEO_MAX_SIZE_BYTES, {
    message: `El vídeo supera el tamaño máximo de ${VEHICLE_VIDEO_MAX_SIZE_BYTES / 1024 / 1024} MB.`,
  })
  size_bytes: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  original_filename?: string;
}

export interface InitVideoUploadResponseDto {
  upload_id: string;
  part_size: number;
  part_count: number;
  expires_at: string;
}

export class VideoPartUrlsHttpDto {
  @IsArray({ message: "Las partes no son válidas." })
  @ArrayMinSize(1, { message: "Indica al menos una parte." })
  @ArrayMaxSize(VEHICLE_VIDEO_MAX_PART_URLS_PER_REQUEST, {
    message: `Pide como máximo ${VEHICLE_VIDEO_MAX_PART_URLS_PER_REQUEST} partes por petición.`,
  })
  @Type(() => Number)
  @IsInt({ each: true, message: "Número de parte no válido." })
  @Min(1, { each: true, message: "Número de parte no válido." })
  @Max(MAX_PARTS, { each: true, message: "Número de parte no válido." })
  part_numbers: number[];
}

export interface VideoPartUrlsResponseDto {
  urls: { part_number: number; url: string }[];
}

export interface VideoUploadedPartsResponseDto {
  parts: { part_number: number; etag: string; size: number }[];
}

export class CompletedVideoPartHttpDto {
  @Type(() => Number)
  @IsInt({ message: "Número de parte no válido." })
  @Min(1)
  @Max(MAX_PARTS)
  part_number: number;

  @IsString({ message: "ETag no válido." })
  @IsNotEmpty({ message: "Falta el ETag de una parte." })
  @MaxLength(200)
  etag: string;
}

export class CompleteVideoUploadHttpDto {
  @IsArray({ message: "Las partes no son válidas." })
  @ArrayMinSize(1, { message: "Indica las partes subidas." })
  @ArrayMaxSize(MAX_PARTS)
  @ValidateNested({ each: true })
  @Type(() => CompletedVideoPartHttpDto)
  parts: CompletedVideoPartHttpDto[];
}

export interface CompleteVideoUploadResponseDto {
  upload_id: string;
  status: "uploaded";
  duration_s: number | null;
  width: number | null;
  height: number | null;
  expires_at: string;
}
