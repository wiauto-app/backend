import { IsArray, IsIn, IsNotEmpty, IsString } from "class-validator";
import { envs } from "@/src/common/envs";

export class RemoveFilesHttpDto {
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  paths: string[];

  @IsString()
  @IsNotEmpty()
  @IsIn(envs.MINIO_BUCKET_NAMES)
  bucket_name: string;
}