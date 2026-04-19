import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { VehicleRepository } from "../../domain/vehicle.repository";
import { Vehicle } from "../../domain/vehicle";
import { VehicleEntity } from "../persistence/vehicle.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";


@Injectable()
export class TypeOrmVehicleRepository extends VehicleRepository {

  constructor(
    @InjectRepository(VehicleEntity)
    private readonly vehicleRepository: Repository<VehicleEntity>
  ) {
    super();
  }

  async save(vehicle: Vehicle): Promise<void> {
    await this.vehicleRepository.save(vehicle.toPrimitives());
  }

  async findOne(id: string): Promise<Vehicle | null> {
    const vehicle = await this.vehicleRepository.findOne({ where: { id } });
    if (!vehicle) return null;
    return new Vehicle(vehicle);
  }
}