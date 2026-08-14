import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { PromoteTempStoragePathsService } from "@/src/contexts/shared/file/services/promote-temp-storage-paths.service";

import { AttachVehicleImagesFromTempDto } from "../dto/attach-vehicle-images-from-temp.dto";
import { is_temp_storage_path } from "@/src/contexts/shared/file/types/temp-storage-path";
import { Repository } from "typeorm";
import { VehicleImagesEntity } from "../entities/vehicle-images.entity";
import { InjectRepository } from "@nestjs/typeorm";

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
    const sorted_images = [...dto.images].sort(
      (a, b) => a.order - b.order,
    );

    /**
     * ============================================================
     * 1. OBTENER LAS IMÁGENES ACTUALES DEL VEHÍCULO
     * ============================================================
     */
    const existing_images =
      await this.vehicle_images_repository.find({
        where: {
          vehicle_id: dto.vehicle_id,
        },
      });

    /**
     * ============================================================
     * 2. PROMOVER IMÁGENES TEMPORALES
     * ============================================================
     *
     * Es importante mantener la relación:
     *
     * temporary path -> permanent path
     *
     * porque pueden existir imágenes permanentes mezcladas
     * con temporales.
     */
    const temp_images = sorted_images.filter((image) =>
      is_temp_storage_path(image.path),
    );

    const promoted_paths_map = new Map<string, string>();

    if (temp_images.length > 0) {
      const { pathnames } =
        await this.promote_temp_storage_paths_service.execute({
          paths: temp_images.map((image) => image.path),
        });

      if (pathnames.length !== temp_images.length) {
        throw new Error(
          "No se pudieron promover correctamente todas las imágenes temporales.",
        );
      }

      temp_images.forEach((image, index) => {
        promoted_paths_map.set(
          image.path,
          pathnames[index],
        );
      });
    }

    /**
     * ============================================================
     * 3. OBTENER LOS IDS QUE VIENEN DEL FRONTEND
     * ============================================================
     */
    const incoming_ids = new Set(
      sorted_images
        .map((image) => image.id)
        .filter((id): id is string => Boolean(id)),
    );

    /**
     * ============================================================
     * 4. ELIMINAR IMÁGENES QUE YA NO EXISTEN EN EL FORMULARIO
     * ============================================================
     *
     * Si una imagen estaba en BD pero ya no viene en dto.images,
     * significa que el usuario la eliminó.
     */
    const images_to_delete = existing_images.filter(
      (image) => !incoming_ids.has(image.id),
    );

    if (images_to_delete.length > 0) {
      await this.vehicle_images_repository.remove(images_to_delete);
    }

    /**
     * ============================================================
     * 5. VALIDAR IDS EXISTENTES
     * ============================================================
     *
     * Evita que alguien envíe el ID de una imagen perteneciente
     * a otro vehículo.
     */
    const existing_images_map = new Map(
      existing_images.map((image) => [image.id, image]),
    );

    for (const image of sorted_images) {
      if (!image.id) {
        continue;
      }

      const existing_image = existing_images_map.get(image.id);

      if (!existing_image) {
        throw new Error(
          `La imagen ${image.id} no pertenece al vehículo ${dto.vehicle_id}.`,
        );
      }
    }

    /**
     * ============================================================
     * 6. CREAR / ACTUALIZAR
     * ============================================================
     *
     * TypeORM:
     *
     *   id presente -> UPDATE
     *   id ausente  -> INSERT
     *
     * El order recibido es el orden definitivo.
     */
    const images_to_save = sorted_images.map((image) => ({
      ...(image.id
        ? {
            id: image.id,
          }
        : {}),

      vehicle_id: dto.vehicle_id,

      url:
        promoted_paths_map.get(image.path) ??
        image.path,

      order: image.order,
    }));

    /**
     * ============================================================
     * 7. GUARDAR TODO
     * ============================================================
     *
     * save() hace INSERT para las nuevas y UPDATE para las
     * existentes.
     */
    if (images_to_save.length > 0) {
      await this.vehicle_images_repository.save(images_to_save);
    }

    return {
      count: images_to_save.length,
    };
  }
}