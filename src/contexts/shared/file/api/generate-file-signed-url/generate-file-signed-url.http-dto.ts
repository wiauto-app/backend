import { IsIn, IsNotEmpty, IsString } from "class-validator";
import { CONTENT_TYPES, ContentType } from "../../ports/file-storage.port";
import { envs } from "@/src/common/envs";

const CONTENT_TYPE_VALUES = Object.values(CONTENT_TYPES);

export class GenerateFileSignedUrlHttpDto {
  @IsString()
  @IsNotEmpty()
  file_key: string;

  @IsIn(CONTENT_TYPE_VALUES)
  @IsNotEmpty()
  content_type: ContentType;

  @IsString()
  @IsNotEmpty()
  @IsIn(envs.MINIO_BUCKET_NAMES)
  bucket_name: string;
}