import { IsNotEmpty, IsString } from "class-validator";


export class CreateFeatureHttpDto {
  @IsString()
  @IsNotEmpty()
  name: string;
}