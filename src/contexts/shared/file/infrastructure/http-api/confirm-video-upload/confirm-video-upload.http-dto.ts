import { IsNotEmpty, IsString } from "class-validator";

export class ConfirmVideoUploadHttpDto {
  @IsString()
  @IsNotEmpty()
  file_key: string;
}