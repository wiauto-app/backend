import { BadRequestException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { PromoteTempStoragePathsService } from "@/src/contexts/shared/file/services/promote-temp-storage-paths.service";
import { is_temp_storage_path } from "@/src/contexts/shared/file/types/temp-storage-path";
import { VehicleEntity } from "@/src/contexts/vehicles/entities/vehicle.entity";

import { AttachVehicleImagesFromTempDto } from "../dto/attach-vehicle-images-from-temp.dto";
import { VehicleImagesEntity } from "../entities/vehicle-images.entity";
import { TempUploadService } from "./temp-upload.service";
import type { TemporaryUploadEntity } from "@/src/contexts/shared/file/entities/temporary-upload.entity";
import type { VehiclePostCommitImageItem } from "../../queues/vehicle-post-commit.queue.constants";

export interface AttachVehicleImagesFromTempResult {
  count: number;
  pending_images: VehiclePostCommitImageItem[];
}

const has_ready_storage_url = (url: string | null | undefined): boolean => {
  const stored = url?.trim() ?? "";
  if (!stored || is_temp_storage_path(stored)) {
    return false;
  }
  return !/^https?:\/\//i.test(stored);
};

const resolve_path_image_url = (
  image: { id?: string; path?: string },
  existing: VehicleImagesEntity | undefined,
  promoted_paths_map: Map<string, string>,
): string => {
  const path = image.path!.trim();
  if (
    is_temp_storage_path(path) &&
    image.id &&
    has_ready_storage_url(existing?.url)
  ) {
    return existing!.url!.trim();
  }
  return promoted_paths_map.get(path) ?? path;
};

const is_storage_object_missing_error = (error: unknown): boolean => {
  if (!error || typeof error !== "object") {
    return false;
  }
  const record = error as { name?: string; Code?: string };
  return record.name === "NoSuchKey" || record.Code === "NoSuchKey";
};

@Injectable()
export class AttachVehicleImagesFromTempService {
  constructor(
    private readonly promote_temp_storage_paths_service: PromoteTempStoragePathsService,
    private readonly tempUploadService: TempUploadService,
    @InjectRepository(VehicleImagesEntity)
    private readonly vehicle_images_repository: Repository<VehicleImagesEntity>,

    @InjectRepository(VehicleEntity)
    private readonly vehicle_repository: Repository<VehicleEntity>,
  ) {}

  async execute(
    dto: AttachVehicleImagesFromTempDto,
  ): Promise<AttachVehicleImagesFromTempResult> {
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
      if (image.upload_id || image.path) {
        continue;
      }
      if (image.id && existing_images_map.has(image.id)) {
        continue;
      }
      throw new Error(
        "Cada imagen debe incluir upload_id, path o un id de foto existente.",
      );
    }

    const vehicle = await this.vehicle_repository.findOne({
      where: { id: dto.vehicle_id },
      select: { id: true, profile_id: true },
    });
    if (!vehicle?.profile_id) {
      throw new Error(`Vehículo ${dto.vehicle_id} no encontrado.`);
    }

    const uploader_profile_id =
      dto.uploader_profile_id?.trim() || vehicle.profile_id;

    const incoming_ids = new Set(
      sorted_images.map(image => image.id).filter(Boolean),
    );
    const images_to_delete = existing_images.filter(
      image => !incoming_ids.has(image.id),
    );

    const async_images = sorted_images.filter(image => Boolean(image.upload_id));
    const order_only_images = sorted_images.filter(
      image => Boolean(image.id) && !image.upload_id && !image.path,
    );
    const path_images = sorted_images.filter(image => !image.upload_id && image.path);

    const validatedTempUploads =
      async_images.length > 0
        ? await Promise.all(
            async_images.map(image =>
              this.tempUploadService.validateAndGetTempUpload(
                image.upload_id!,
                uploader_profile_id,
              ),
            ),
          )
        : [];

    const temp_images = path_images.filter(image => {
      if (!is_temp_storage_path(image.path!)) {
        return false;
      }
      if (image.id) {
        const existing = existing_images_map.get(image.id);
        if (has_ready_storage_url(existing?.url)) {
          return false;
        }
      }
      return true;
    });
    const temp_paths = temp_images.map(image => image.path!);
    const promoted_paths_map = new Map<string, string>();

    if (temp_images.length > 0) {
      let pathnames: string[];
      try {
        ({ pathnames } = await this.promote_temp_storage_paths_service.execute({
          paths: temp_paths,
        }));
      } catch (promoteError) {
        if (is_storage_object_missing_error(promoteError)) {
          throw new BadRequestException(
            "Alguna foto temporal ya no está en el almacenamiento. Vuelve a subirla.",
          );
        }
        throw promoteError;
      }

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
      tempUpload: TemporaryUploadEntity;
    }> = [];

    try {
      await this.vehicle_images_repository.manager.transaction(
        async manager => {
          if (images_to_delete.length > 0) {
            await manager.remove(VehicleImagesEntity, images_to_delete);
          }

          const entities_to_save: VehicleImagesEntity[] = [];

          for (const image of order_only_images) {
            const existing = existing_images_map.get(image.id!);
            if (!existing) {
              continue;
            }
            entities_to_save.push(
              manager.create(VehicleImagesEntity, {
                id: existing.id,
                vehicle_id: dto.vehicle_id,
                url: existing.url,
                source_path: existing.source_path,
                status: existing.status,
                failure_reason: existing.failure_reason,
                order: image.order,
              }),
            );
          }

          for (const image of path_images) {
            const existing = image.id
              ? existing_images_map.get(image.id)
              : undefined;
            entities_to_save.push(
              manager.create(VehicleImagesEntity, {
                ...(image.id ? { id: image.id } : {}),
                vehicle_id: dto.vehicle_id,
                url: resolve_path_image_url(
                  image,
                  existing,
                  promoted_paths_map,
                ),
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
                source_path: null,
                url: null,
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
                tempUpload,
              });
            }
          }

          if (async_images.length > 0) {
            await this.tempUploadService.markAsConsumed(
              async_images.map(image => image.upload_id!),
              manager,
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

    return {
      count: sorted_images.length,
      pending_images: enqueued.map(item => ({
        image_id: item.image_id,
        upload_id: item.tempUpload.id,
        order: item.order,
      })),
    };
  }
}
