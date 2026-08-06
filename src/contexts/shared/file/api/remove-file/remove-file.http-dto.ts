import { IsArray, IsIn, IsNotEmpty, IsString } from "class-validator";

import { STORAGE_DIRECTORY_VALUES } from "../../storage-directories";

export class RemoveFilesHttpDto {
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  paths: string[];

  /** Directorio lógico dentro del único bucket R2. */
  @IsString()
  @IsNotEmpty()
  @IsIn(STORAGE_DIRECTORY_VALUES)
  bucket_name: string;
}