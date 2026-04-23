import { InjectRepository } from "@nestjs/typeorm";
import { DeepPartial } from "typeorm";
import { Repository } from "typeorm";

import { VehicleEntity } from "@/src/contexts/vehicles/infrastructure/persistence/vehicle.entity";
import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";

import { VehicleImage } from "../../domain/vehicle-image";
import { VehicleImageRepository } from "../../domain/vehicle-imagen.repository";
import { VehicleImagesEntity } from "../persistence/vehicle-images.entity";

@Injectable()
export class TypeOrmVehicleImagesRepository implements VehicleImageRepository {
  constructor(
    @InjectRepository(VehicleImagesEntity)
    private readonly vehicleImagesRepository: Repository<VehicleImagesEntity>,
  ) {
  }

  private to_persistence(vehicleImage: VehicleImage): DeepPartial<VehicleImagesEntity> {
    const p = vehicleImage.toPrimitives();
    return {
      id: p.id,
      url: p.url,
      created_at: p.created_at,
      updated_at: p.updated_at,
      vehicle: { id: p.vehicle_id } as VehicleEntity,
    };
  }

  async save(vehicleImage: VehicleImage): Promise<void> {
    await this.vehicleImagesRepository.save(this.to_persistence(vehicleImage));
  }

  async saveBulk(vehicleImages: VehicleImage[]): Promise<void> {
    await this.vehicleImagesRepository.save(vehicleImages.map((v) => this.to_persistence(v)));
  }

  async delete(vehicleImage: VehicleImage): Promise<void> {
    await this.vehicleImagesRepository.delete(vehicleImage.toPrimitives().id);
  }
}