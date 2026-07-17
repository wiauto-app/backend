import { IsNotEmpty, IsString } from "class-validator";

export class CreateWarrantyTypeHttpDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  description: string;
}
