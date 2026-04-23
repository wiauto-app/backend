import { CreateVehicleImageDto } from "./create-vehicle-image.dto";
import { VehicleImageRepository } from "../../domain/vehicle-imagen.repository";
import { PrimitiveVehicleImage, VehicleImage } from "../../domain/vehicle-image";
import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";

@Injectable()
export class CreateVehicleImageUseCase {
  constructor(
    private readonly vehicleImageRepository: VehicleImageRepository
  ) { }

  async execute(createVehicleImageDto: CreateVehicleImageDto): Promise<{ image: PrimitiveVehicleImage }> {
    const image = VehicleImage.create(createVehicleImageDto);
    await this.vehicleImageRepository.save(image);
    return { image: image.toPrimitives() };
  }
}