import { IsNotEmpty, IsString } from "class-validator";


export class BulkVehicleImagesHttpDto {
  @IsString()
  @IsNotEmpty()
  vehicle_id: string;

  files: Express.Multer.File[];
}