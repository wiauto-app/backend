import { IsIn, IsNotEmpty, IsString } from "class-validator";
import { CONTENT_TYPES, ContentType } from "../../ports/file-storage.port";
import { STORAGE_DIRECTORY_VALUES } from "../../storage-directories";

const CONTENT_TYPE_VALUES = Object.values(CONTENT_TYPES);

export class GenerateFileSignedUrlHttpDto {
  @IsString()
  @IsNotEmpty()
  file_key: string;

  @IsIn(CONTENT_TYPE_VALUES)
  @IsNotEmpty()
  content_type: ContentType;

  /** Directorio lógico dentro del único bucket R2 (p. ej. vehicles-images). */
  @IsString()
  @IsNotEmpty()
  @IsIn(STORAGE_DIRECTORY_VALUES)
  bucket_name: string;
}