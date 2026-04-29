import { CreateVehicleHttpDto } from "../create-vehicle/create-vehicle.http-dto";
import { PartialType } from "@nestjs/mapped-types";

export class UpdateVehicleHttpDto extends PartialType(CreateVehicleHttpDto){
  
}
