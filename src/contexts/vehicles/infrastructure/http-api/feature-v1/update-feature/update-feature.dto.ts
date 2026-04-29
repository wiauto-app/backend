import { IsNotEmpty, IsString, IsUUID } from "class-validator";

export class UpdateFeatureHttpDto {
  @IsNotEmpty()
  @IsUUID("4")
  id: string;

  @IsString()
  @IsNotEmpty()
  name: string;
}