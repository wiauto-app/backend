import { IsNotEmpty, IsString, IsUrl } from "class-validator";


export class VehicleCreatorDto {
  @IsString()
  @IsNotEmpty()
  @IsUrl()
  image_url: string;
}