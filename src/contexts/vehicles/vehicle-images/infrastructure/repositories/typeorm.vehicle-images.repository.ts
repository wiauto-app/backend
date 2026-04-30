import { InjectRepository } from "@nestjs/typeorm";
import { DeepPartial, Repository } from "typeorm";
import { lastValueFrom } from "rxjs";

import { VehicleEntity } from "@/src/contexts/vehicles/infrastructure/persistence/vehicle.entity";
import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";

import { VehicleImage } from "../../domain/vehicle-image";
import { VehicleImageRepository } from "../../domain/vehicle-imagen.repository";
import { VehicleImagesEntity } from "../persistence/vehicle-images.entity";
import { MinioService } from "@/src/contexts/shared/minio-provider/minio.service";

@Injectable()
export class TypeOrmVehicleImagesRepository implements VehicleImageRepository {
  constructor(
    @InjectRepository(VehicleImagesEntity)
    private readonly vehicleImagesRepository: Repository<VehicleImagesEntity>,
    private readonly minioService: MinioService,
  ) {}

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
    await this.vehicleImagesRepository.save(
      vehicleImages.map((v) => this.to_persistence(v)),
    );
  }

  async delete(vehicleImage: VehicleImage): Promise<void> {
    const p = vehicleImage.toPrimitives();
    await lastValueFrom(this.minioService.deleteFileByUrl(p.url));
    await this.vehicleImagesRepository.delete(p.id);
  }

  async remove_storage_for_vehicle(vehicle_id: string): Promise<void> {
    const rows = await this.vehicleImagesRepository.find({
      where: { vehicle: { id: vehicle_id } },
    });
    for (const row of rows) {
      await lastValueFrom(this.minioService.deleteFileByUrl(row.url));
    }
  }
}
