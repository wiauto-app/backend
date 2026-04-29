import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { VehicleTypesRepository } from "../../domain/repositories/vehicle-types.repository";
import { CreateVehicleTypeDto } from "./dto/create-vehicle-type.dto";
import { PrimitiveVehicleType, VehicleType } from "../../domain/entities/vehicle-types";
import { VehicleTypeNotFoundException } from "../../domain/exceptions/vehicle-type-not-found.exception";
import { UpdateVehicleTypeDto } from "./dto/update-vehicle-type.dto";

@Injectable()
export class VehicleTypesUseCase {
  constructor(private readonly vehicleTypesRepository: VehicleTypesRepository) { }

  async create(createVehicleTypeDto: CreateVehicleTypeDto): Promise<{ vehicleType: PrimitiveVehicleType }> {
    const vehicleType = VehicleType.create({ name: createVehicleTypeDto.name });
    await this.vehicleTypesRepository.save(vehicleType);
    return { vehicleType: vehicleType.toPrimitives() };
  }

  async update(id: string, update_vehicle_type_dto: UpdateVehicleTypeDto): Promise<{ vehicleType: PrimitiveVehicleType }> {
    const vehicle_type = await this.vehicleTypesRepository.findOne(id);
    if (!vehicle_type) {
      throw new VehicleTypeNotFoundException(id);
    }
    const previous = vehicle_type.toPrimitives();
    const next_name = update_vehicle_type_dto.name ?? previous.name;
    const updated_vehicle_type = vehicle_type.update({ name: next_name });
    await this.vehicleTypesRepository.update(id, updated_vehicle_type.toPrimitives().name);
    return { vehicleType: updated_vehicle_type.toPrimitives() };
  }

  async findAll(): Promise<{ vehicleTypes: PrimitiveVehicleType[] }> {
    const vehicleTypes = await this.vehicleTypesRepository.findAll();
    return { vehicleTypes: vehicleTypes.map(vehicleType => vehicleType.toPrimitives()) };
  }

  async findOne(id: string): Promise<{ vehicleType: PrimitiveVehicleType }> {
    const vehicleType = await this.vehicleTypesRepository.findOne(id);
    if (!vehicleType) {
      throw new VehicleTypeNotFoundException(id);
    }
    return { vehicleType: vehicleType.toPrimitives() };
  }

  async remove(id: string): Promise<void> {
    await this.vehicleTypesRepository.remove(id);
  }
}