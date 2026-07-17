import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { PromoteTempStoragePathsService } from "@/src/contexts/shared/file/services/promote-temp-storage-paths.service";

import { VehicleImage } from "../types/vehicle-image";
import { TypeOrmVehicleImagesRepository } from "@/src/contexts/vehicles/vehicle-images/repositories/typeorm.vehicle-images.repository";
import { AttachVehicleImagesFromTempDto } from "../dto/attach-vehicle-images-from-temp.dto";

@Injectable()
export class AttachVehicleImagesFromTempService {
  constructor(
    private readonly promote_temp_storage_paths_service: PromoteTempStoragePathsService,
    private readonly vehicle_image_repository: TypeOrmVehicleImagesRepository,
  ) {}

  async execute(
    dto: AttachVehicleImagesFromTempDto,
  ): Promise<{ count: number }> {
    if (dto.images.length === 0) {
      return { count: 0 };
    }

    const sorted_images = [...dto.images].sort((a, b) => a.order - b.order);
    const { pathnames } = await this.promote_temp_storage_paths_service.execute({
      paths: sorted_images.map((image) => image.path),
    });
    const vehicle_images = pathnames.map((url) =>
      VehicleImage.create({
        url,
        vehicle_id: dto.vehicle_id,
      }),
    );
    await this.vehicle_image_repository.saveBulk(vehicle_images);

    return { count: vehicle_images.length };
  }
}
