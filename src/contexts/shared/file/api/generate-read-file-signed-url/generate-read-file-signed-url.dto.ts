import { IsNotEmpty, IsString } from "class-validator";


export class GenerateReadFileSignedUrlDto {
  @IsString()
  @IsNotEmpty()
  file_key: string;

  @IsString()
  @IsNotEmpty()
  bucket_name: string;
}