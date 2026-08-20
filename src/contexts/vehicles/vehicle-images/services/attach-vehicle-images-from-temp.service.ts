import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { PromoteTempStoragePathsService } from "@/src/contexts/shared/file/services/promote-temp-storage-paths.service";
import { is_temp_storage_path } from "@/src/contexts/shared/file/types/temp-storage-path";

import { AttachVehicleImagesFromTempDto } from "../dto/attach-vehicle-images-from-temp.dto";
import { VehicleImagesEntity } from "../entities/vehicle-images.entity";

@Injectable()
export class AttachVehicleImagesFromTempService {
  constructor(
    private readonly promote_temp_storage_paths_service: PromoteTempStoragePathsService,

    @InjectRepository(VehicleImagesEntity)
    private readonly vehicle_images_repository: Repository<VehicleImagesEntity>,
  ) {}

  async execute(
    dto: AttachVehicleImagesFromTempDto,
  ): Promise<{ count: number }> {
    const sorted_images = [...dto.images].sort((a, b) => a.order - b.order);
    const existing_images = await this.vehicle_images_repository.find({
      where: { vehicle_id: dto.vehicle_id },
    });
    const existing_images_map = new Map(
      existing_images.map((image) => [image.id, image]),
    );

    // Validate ownership before moving files or mutating persisted images.
    for (const image of sorted_images) {
      if (image.id && !existing_images_map.has(image.id)) {
        throw new Error(
          `La imagen ${image.id} no pertenece al vehículo ${dto.vehicle_id}.`,
        );
      }
    }

    const incoming_ids = new Set(
      sorted_images
        .map((image) => image.id)
        .filter(Boolean),
    );
    const images_to_delete = existing_images.filter(
      (image) => !incoming_ids.has(image.id),
    );
    const temp_images = sorted_images.filter((image) =>
      is_temp_storage_path(image.path),
    );
    const temp_paths = temp_images.map((image) => image.path);
    const promoted_paths_map = new Map<string, string>();

    if (temp_images.length > 0) {
      const { pathnames } =
        await this.promote_temp_storage_paths_service.execute({
          paths: temp_paths,
        });

      if (pathnames.length !== temp_images.length) {
        const promotion_error = new Error(
          "No se pudieron promover correctamente todas las imágenes temporales.",
        );
        try {
          await this.promote_temp_storage_paths_service.rollback({
            paths: temp_paths,
          });
        } catch (rollback_error) {
          throw new AggregateError(
            [promotion_error, rollback_error],
            "La promoción de imágenes quedó incompleta y su rollback falló",
          );
        }
        throw promotion_error;
      }

      for (const [index, image] of temp_images.entries()) {
        promoted_paths_map.set(image.path, pathnames[index]);
      }
    }

    const images_to_save = sorted_images.map((image) => ({
      ...(image.id ? { id: image.id } : {}),
      vehicle_id: dto.vehicle_id,
      url: promoted_paths_map.get(image.path) ?? image.path,
      order: image.order,
    }));

    try {
      await this.vehicle_images_repository.manager.transaction(
        async (manager) => {
          if (images_to_delete.length > 0) {
            await manager.remove(VehicleImagesEntity, images_to_delete);
          }
          if (images_to_save.length > 0) {
            await manager.save(VehicleImagesEntity, images_to_save);
          }
        },
      );
    } catch (error) {
      if (temp_paths.length === 0) {
        throw error;
      }

      try {
        await this.promote_temp_storage_paths_service.rollback({
          paths: temp_paths,
        });
      } catch (rollback_error) {
        throw new AggregateError(
          [error, rollback_error],
          "Falló la actualización de imágenes y también su rollback",
        );
      }
      throw error;
    }

    return { count: images_to_save.length };
  }
}
