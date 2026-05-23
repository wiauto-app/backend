import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { PromoteTempStoragePathsUseCase } from "@/src/contexts/shared/file/application/promote-temp-storage-paths-use-case/promote-temp-storage-paths.use-case";

import { VehicleImage } from "../../domain/vehicle-image";
import { VehicleImageRepository } from "../../domain/vehicle-imagen.repository";
import { AttachVehicleImagesFromTempDto } from "./attach-vehicle-images-from-temp.dto";

@Injectable()
export class AttachVehicleImagesFromTempUseCase {
  constructor(
    private readonly promote_temp_storage_paths_use_case: PromoteTempStoragePathsUseCase,
    private readonly vehicle_image_repository: VehicleImageRepository,
  ) {}

  async execute(
    dto: AttachVehicleImagesFromTempDto,
  ): Promise<{ count: number }> {
    if (dto.images.length === 0) {
      return { count: 0 };
    }

    const sorted_images = [...dto.images].sort((a, b) => a.order - b.order);
    const { pathnames } = await this.promote_temp_storage_paths_use_case.execute({
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
