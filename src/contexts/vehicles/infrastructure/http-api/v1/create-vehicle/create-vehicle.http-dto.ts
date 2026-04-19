import { IsNotEmpty, IsNumber, IsString, Min, MinLength } from "class-validator";



export class CreateVehicleHttpDto {
  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  price: number;
  
  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  mileage: number;

  @IsNumber()
  @IsNotEmpty()
  lat: number;

  @IsNumber()
  @IsNotEmpty()
  lng: number;

  @IsString()
  @IsNotEmpty()
  condition: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  title: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  description: string;

  @IsNumber()
  @IsNotEmpty()
  version_id: number;
}