import { CreateVehicleImageDto } from "../dto/create-vehicle-image.dto";
import { TypeOrmVehicleImagesRepository } from "@/src/contexts/vehicles/vehicle-images/repositories/typeorm.vehicle-images.repository";
import { PrimitiveVehicleImage, VehicleImage } from "../types/vehicle-image";
import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";

@Injectable()
export class CreateVehicleImageService {
  constructor(
    private readonly vehicleImageRepository: TypeOrmVehicleImagesRepository
  ) { }

  async execute(createVehicleImageDto: CreateVehicleImageDto): Promise<{ image: PrimitiveVehicleImage }> {
    const image = VehicleImage.create(createVehicleImageDto);
    await this.vehicleImageRepository.save(image);
    return { image: image.toPrimitives() };
  }
}