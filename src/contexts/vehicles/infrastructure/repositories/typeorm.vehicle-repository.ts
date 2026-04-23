import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { PrimitiveVehicle, Vehicle } from "../../domain/vehicle";
import { VehicleRepository } from "../../domain/vehicle.repository";
import { VehicleEntity } from "../persistence/vehicle.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

function entityToPrimitives(entity: VehicleEntity): PrimitiveVehicle {
  return {
    id: entity.id,
    price: entity.price,
    mileage: entity.mileage,
    lat: Number(entity.lat),
    lng: Number(entity.lng),
    condition: entity.condition,
    title: entity.title,
    description: entity.description,
    version_id: entity.version_id,
    status: entity.status,
    is_featured: entity.is_featured,
    expires_at: entity.expires_at,
    views: entity.views,
    created_at: entity.created_at,
    updated_at: entity.updated_at,
  };
}

@Injectable()
export class TypeOrmVehicleRepository extends VehicleRepository {
  constructor(
    @InjectRepository(VehicleEntity)
    private readonly vehicleRepository: Repository<VehicleEntity>,
  ) {
    super();
  }

  async save(vehicle: Vehicle): Promise<void> {
    await this.vehicleRepository.save(vehicle.toPrimitives());
  }

  async findOne(id: string): Promise<Vehicle | null> {
    const row = await this.vehicleRepository.findOne({ where: { id } });
    if (!row) return null;
    return Vehicle.fromPrimitives(entityToPrimitives(row));
  }

  async findAll(): Promise<Vehicle[]> {
    const rows = await this.vehicleRepository.find();
    return rows.map((row) => Vehicle.fromPrimitives(entityToPrimitives(row)));
  }

  async update(vehicle: Vehicle): Promise<void> {
    await this.vehicleRepository.save(vehicle.toPrimitives());
  }
}
