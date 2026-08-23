import { InjectQueue } from "@nestjs/bullmq";
import { InjectRepository } from "@nestjs/typeorm";
import { Queue } from "bullmq";
import { Repository } from "typeorm";

import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { PROCESS_VEHICLE_IMAGE_QUEUE } from "@/src/contexts/shared/file/media.constants";
import type { ProcessVehicleImageJob } from "@/src/contexts/shared/file/processors/process-vehicle-image.processor";
import { PromoteTempStoragePathsService } from "@/src/contexts/shared/file/services/promote-temp-storage-paths.service";
import { is_temp_storage_path } from "@/src/contexts/shared/file/types/temp-storage-path";
import { VehicleEntity } from "@/src/contexts/vehicles/entities/vehicle.entity";

import { AttachVehicleImagesFromTempDto } from "../dto/attach-vehicle-images-from-temp.dto";
import { VehicleImagesEntity } from "../entities/vehicle-images.entity";
import { TempUploadService } from "./temp-upload.service";

@Injectable()
export class AttachVehicleImagesFromTempService {
  constructor(
    private readonly promote_temp_storage_paths_service: PromoteTempStoragePathsService,
    private readonly tempUploadService: TempUploadService,
    @InjectQueue(PROCESS_VEHICLE_IMAGE_QUEUE)
    private readonly imageQueue: Queue<ProcessVehicleImageJob>,

    @InjectRepository(VehicleImagesEntity)
    private readonly vehicle_images_repository: Repository<VehicleImagesEntity>,

    @InjectRepository(VehicleEntity)
    private readonly vehicle_repository: Repository<VehicleEntity>,
  ) {}

  async execute(
    dto: AttachVehicleImagesFromTempDto,
  ): Promise<{ count: number }> {
    const sorted_images = [...dto.images].sort((a, b) => a.order - b.order);
    const existing_images = await this.vehicle_images_repository.find({
      where: { vehicle_id: dto.vehicle_id },
    });
    const existing_images_map = new Map(
      existing_images.map(image => [image.id, image]),
    );

    for (const image of sorted_images) {
      if (image.id && !existing_images_map.has(image.id)) {
        throw new Error(
          `La imagen ${image.id} no pertenece al vehículo ${dto.vehicle_id}.`,
        );
      }
      if (!image.upload_id && !image.path) {
        throw new Error(
          "Cada imagen debe incluir upload_id o path.",
        );
      }
    }

    const vehicle = await this.vehicle_repository.findOne({
      where: { id: dto.vehicle_id },
      select: { id: true, profile_id: true },
    });
    if (!vehicle?.profile_id) {
      throw new Error(`Vehículo ${dto.vehicle_id} no encontrado.`);
    }

    const incoming_ids = new Set(
      sorted_images.map(image => image.id).filter(Boolean),
    );
    const images_to_delete = existing_images.filter(
      image => !incoming_ids.has(image.id),
    );

    const async_images = sorted_images.filter(image => Boolean(image.upload_id));
    const path_images = sorted_images.filter(image => !image.upload_id && image.path);

    const validatedTempUploads =
      async_images.length > 0
        ? await Promise.all(
            async_images.map(image =>
              this.tempUploadService.validateAndGetTempUpload(
                image.upload_id!,
                vehicle.profile_id!,
              ),
            ),
          )
        : [];

    const temp_images = path_images.filter(image =>
      is_temp_storage_path(image.path!),
    );
    const temp_paths = temp_images.map(image => image.path!);
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
        promoted_paths_map.set(image.path!, pathnames[index]);
      }
    }

    const enqueued: Array<{
      image_id: string;
      order: number;
      source_path: string;
    }> = [];

    try {
      await this.vehicle_images_repository.manager.transaction(
        async manager => {
          if (images_to_delete.length > 0) {
            await manager.remove(VehicleImagesEntity, images_to_delete);
          }

          const entities_to_save: VehicleImagesEntity[] = [];

          for (const image of path_images) {
            entities_to_save.push(
              manager.create(VehicleImagesEntity, {
                ...(image.id ? { id: image.id } : {}),
                vehicle_id: dto.vehicle_id,
                url: promoted_paths_map.get(image.path!) ?? image.path!,
                order: image.order,
                status: "ready",
              }),
            );
          }

          for (const [index, image] of async_images.entries()) {
            const tempUpload = validatedTempUploads[index];
            entities_to_save.push(
              manager.create(VehicleImagesEntity, {
                vehicle_id: dto.vehicle_id,
                order: image.order,
                status: "uploaded",
                source_path: tempUpload.storage_path,
                url: tempUpload.storage_path,
              }),
            );
          }

          if (entities_to_save.length > 0) {
            const saved = await manager.save(
              VehicleImagesEntity,
              entities_to_save,
            );

            const async_saved = saved.filter(img => img.status === "uploaded");
            for (const [index, savedImage] of async_saved.entries()) {
              const tempUpload = validatedTempUploads[index];
              const asyncInput = async_images[index];
              enqueued.push({
                image_id: savedImage.id,
                order: asyncInput.order,
                source_path: tempUpload.storage_path,
              });
            }
          }

          if (async_images.length > 0) {
            await this.tempUploadService.markAsConsumed(
              async_images.map(image => image.upload_id!),
            );
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

    if (enqueued.length > 0) {
      await this.imageQueue.addBulk(
        enqueued.map(item => ({
          name: `process-vehicle-image-${item.image_id}`,
          data: {
            image_id: item.image_id,
            vehicle_id: dto.vehicle_id,
            source_path: item.source_path,
          } satisfies ProcessVehicleImageJob,
          opts: {
            priority: item.order === 0 ? 1 : 5,
            attempts: 3,
            backoff: { type: "exponential", delay: 2000 },
          },
        })),
      );
    }

    return { count: sorted_images.length };
  }
}
