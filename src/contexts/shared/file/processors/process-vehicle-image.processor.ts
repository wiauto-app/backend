import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Logger } from "@nestjs/common";
import { Job } from "bullmq";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import sharp from "sharp";

import { VehicleImagesEntity } from "@/src/contexts/vehicles/vehicle-images/entities/vehicle-images.entity";
import { ObjectStorageService } from "@/src/contexts/shared/object-storage/object-storage.service";
import { STORAGE_DIRECTORIES } from "../storage-directories";
import { PROCESS_VEHICLE_IMAGE_QUEUE } from "../media.constants";

export interface ProcessVehicleImageJob {
  image_id: string;
  vehicle_id: string;
  source_path: string;
}

@Processor(PROCESS_VEHICLE_IMAGE_QUEUE, {
  concurrency: 3,
})
export class ProcessVehicleImageProcessor extends WorkerHost {
  private readonly logger = new Logger(ProcessVehicleImageProcessor.name);

  constructor(
    @InjectRepository(VehicleImagesEntity)
    private readonly vehicleImagesRepo: Repository<VehicleImagesEntity>,
    private readonly objectStorageService: ObjectStorageService,
  ) {
    super();
  }

  async process(job: Job<ProcessVehicleImageJob>): Promise<void> {
    const { image_id, vehicle_id, source_path } = job.data;

    this.logger.log(
      `Procesando imagen ${image_id} del vehículo ${vehicle_id}`,
    );

    try {
      // 1. Actualizar estado a processing
      await this.vehicleImagesRepo.update(image_id, {
        status: "processing",
      });

      // 2. Descargar archivo TEMP desde R2
      const sourceBuffer = await this.objectStorageService.getObjectBufferByKey(
        source_path,
      );

      if (!sourceBuffer) {
        throw new Error(
          `Archivo fuente no encontrado en ${source_path}`,
        );
      }

      this.logger.log(
        `Archivo descargado: ${sourceBuffer.length} bytes`,
      );

      // 3. Optimizar con Sharp → WebP
      const webpBuffer = await sharp(sourceBuffer)
        .rotate() // Auto-rotar según EXIF
        .resize({
          width: 1920,
          withoutEnlargement: true,
          fit: "inside",
        })
        .webp({ quality: 80, effort: 4 })
        .toBuffer();

      this.logger.log(
        `Imagen optimizada: ${webpBuffer.length} bytes`,
      );

      // 4. Subir a ruta definitiva
      const finalKey = `${vehicle_id}/${image_id}.webp`;
      await this.objectStorageService.putObjectToBucket(
        STORAGE_DIRECTORIES.VEHICLES_IMAGES,
        finalKey,
        webpBuffer,
        "image/webp",
      );

      const finalUrl = this.objectStorageService.buildPublicUrl(
        STORAGE_DIRECTORIES.VEHICLES_IMAGES,
        finalKey,
      );

      this.logger.log(`Imagen subida a ${finalUrl}`);

      // 5. Actualizar estado a ready con URL final
      await this.vehicleImagesRepo.update(image_id, {
        status: "ready",
        url: finalUrl,
      });

      // 6. Borrar archivo TEMP
      try {
        await this.objectStorageService.deleteObjectByKey(
          source_path,
        );
        this.logger.log(`Archivo temporal borrado: ${source_path}`);
      } catch (deleteError) {
        this.logger.warn(
          `No se pudo borrar el archivo temporal ${source_path}: ${deleteError instanceof Error ? deleteError.message : "Error desconocido"}`,
        );
        // No fallar el job por esto
      }

      this.logger.log(
        `Imagen ${image_id} procesada exitosamente`,
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Error desconocido";

      this.logger.error(
        `Error procesando imagen ${image_id}: ${errorMessage}`,
      );

      // Actualizar estado a failed
      await this.vehicleImagesRepo.update(image_id, {
        status: "failed",
        failure_reason: errorMessage,
      });

      throw error; // Re-lanzar para que BullMQ maneje los reintentos
    }
  }
}
