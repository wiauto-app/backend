import { IsEnum, IsNotEmpty, IsString } from "class-validator";
import { CONTENT_TYPES, ContentType } from "../../domain/ports/file-storage.port";


export class GenerateVideoSignedUrlHttpDto {
  @IsString()
  @IsNotEmpty()
  file_key: string;

  @IsEnum( Object.values(CONTENT_TYPES) )
  @IsNotEmpty()
  content_type: ContentType;
}