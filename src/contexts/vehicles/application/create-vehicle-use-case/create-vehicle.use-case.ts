import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { PrimitiveVehicle, Vehicle } from "../../domain/vehicle";
import { VehicleRepository } from "../../domain/vehicle.repository";
import { CreateVehicleDto } from "./create-vehicle.dto";
import { BulkVehicleImagesUseCase } from "../../vehicle-images/application/bulk-vehicle-images-use-case/bulk-vehicle-images.use-case";


@Injectable()
export class CreateVehicleUseCase {
  constructor(
    private readonly vehicleRepository: VehicleRepository,
    private readonly bulkVehicleImagesUseCase: BulkVehicleImagesUseCase
  ) { }

  async execute(createVehicleDto: CreateVehicleDto, files: Express.Multer.File[]): Promise<{ vehicle: PrimitiveVehicle }> {
    const vehicle = Vehicle.create(createVehicleDto);
    await this.vehicleRepository.save(vehicle);
    await this.bulkVehicleImagesUseCase.execute({
      files,
      vehicle_id: vehicle.toPrimitives().id
    });
    return { vehicle: vehicle.toPrimitives() };
  }
}