import { IsNotEmpty, IsNumber, IsString, Max, Min, MinLength } from "class-validator";
import { IsTempStoragePath } from "@/src/contexts/shared/file/infrastructure/validators/is-temp-storage-path.validator";

export class ImageHttpDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @IsTempStoragePath()
  path: string;

  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  @Max(100)
  order: number;
}