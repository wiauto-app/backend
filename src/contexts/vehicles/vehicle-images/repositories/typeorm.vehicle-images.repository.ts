import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { lastValueFrom } from "rxjs";

import { VehicleEntity } from "@/src/contexts/vehicles/entities/vehicle.entity";
import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";

import { VehicleImage } from "../types/vehicle-image";
import { VehicleImagesEntity } from "../entities/vehicle-images.entity";
import { ObjectStorageService } from "@/src/contexts/shared/object-storage/object-storage.service";

@Injectable()
export class TypeOrmVehicleImagesRepository {
  constructor(
    @InjectRepository(VehicleImagesEntity)
    private readonly vehicleImagesRepository: Repository<VehicleImagesEntity>,
    private readonly objectStorageService: ObjectStorageService,
  ) {}

  private to_entity(vehicleImage: VehicleImage): VehicleImagesEntity {
    const p = vehicleImage.toPrimitives();
    return this.vehicleImagesRepository.create({
      id: p.id,
      url: p.url,
      created_at: p.created_at,
      updated_at: p.updated_at,
      vehicle: { id: p.vehicle_id } as VehicleEntity,
    });
  }

  async save(vehicleImage: VehicleImage): Promise<void> {
    const entity = this.to_entity(vehicleImage);
    await this.vehicleImagesRepository.save(entity);
  }

  async saveBulk(vehicleImages: VehicleImage[]): Promise<void> {
    if (vehicleImages.length === 0) {
      return;
    }
    await this.vehicleImagesRepository.save(
      vehicleImages.map((image) => this.to_entity(image)),
    );
  }

  async countByVehicleId(vehicle_id: string): Promise<number> {
    return this.vehicleImagesRepository.count({
      where: { vehicle_id },
    });
  }

  async delete(vehicleImage: VehicleImage): Promise<void> {
    const p = vehicleImage.toPrimitives();
    await lastValueFrom(this.objectStorageService.deleteFileByUrl(p.url));
    await this.vehicleImagesRepository.delete(p.id);
  }

  async remove_storage_for_vehicle(vehicle_id: string): Promise<void> {
    const rows = await this.vehicleImagesRepository.find({
      where: { vehicle: { id: vehicle_id } },
    });
    for (const row of rows) {
      if (row.url) {
        await lastValueFrom(this.objectStorageService.deleteFileByUrl(row.url));
      }
      // También eliminar source_path si existe (TEMP)
      if (row.source_path && row.source_path !== row.url) {
        await lastValueFrom(
          this.objectStorageService.deleteFileByUrl(row.source_path),
        );
      }
    }
  }
}
