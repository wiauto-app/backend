import { IsEnum, IsIn, IsNotEmpty, IsString } from "class-validator";
import { CONTENT_TYPES, ContentType } from "../../../domain/ports/file-storage.port";
import { envs } from "@/src/common/envs";


export class GenerateFileSignedUrlHttpDto {
  @IsString()
  @IsNotEmpty()
  file_key: string;

  @IsEnum( Object.values(CONTENT_TYPES) )
  @IsNotEmpty()
  content_type: ContentType;

  @IsString()
  @IsNotEmpty()
  @IsIn(envs.MINIO_BUCKET_NAMES)
  bucket_name: string;
}