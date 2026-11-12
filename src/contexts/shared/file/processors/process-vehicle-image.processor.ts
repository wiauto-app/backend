import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Logger } from "@nestjs/common";
import { Job } from "bullmq";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { VehicleImagesEntity } from "@/src/contexts/vehicles/vehicle-images/entities/vehicle-images.entity";
import { ObjectStorageService } from "@/src/contexts/shared/object-storage/object-storage.service";
import { STORAGE_DIRECTORIES } from "../storage-directories";
import { PROCESS_VEHICLE_IMAGE_QUEUE } from "../media.constants";
import { VehicleDetailCacheService } from "@/src/contexts/vehicles/services/vehicle-detail-cache.service";
import { ImageOptimizationPipeline } from "../image-formats/image-optimization-pipeline.service";
import { resolveMimeTypeFromObjectKey } from "../image-formats/utils/resolve-mime-type-from-object-key";

export interface ProcessVehicleImageJob {
  image_id: string;
  vehicle_id: string;
  source_path: string;
  output_key: string;
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
    private readonly vehicleDetailCache: VehicleDetailCacheService,
    private readonly imageOptimizationPipeline: ImageOptimizationPipeline,
  ) {
    super();
  }

  private async invalidateVehicleDetail(vehicleId: string): Promise<void> {
    try {
      await this.vehicleDetailCache.invalidate(vehicleId);
    } catch (error) {
      this.logger.warn(
        `No se pudo invalidar la caché del vehículo ${vehicleId}: ${error instanceof Error ? error.message : "Error desconocido"}`,
      );
    }
  }

  async process(job: Job<ProcessVehicleImageJob>): Promise<void> {
    const { image_id, vehicle_id, source_path, output_key: outputKey } =
      job.data;

    this.logger.log(
      `Procesando imagen ${image_id} del vehículo ${vehicle_id}`,
    );

    try {
      await this.vehicleImagesRepo.update(image_id, {
        status: "processing",
      });

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

      const mimeType = resolveMimeTypeFromObjectKey(source_path);
      const optimized = await this.imageOptimizationPipeline.execute({
        buffer: sourceBuffer,
        mimeType,
        objectKey: source_path,
      });

      this.logger.log(
        `Imagen optimizada: ${optimized.buffer.length} bytes`,
      );

      await this.objectStorageService.putObjectToBucket(
        STORAGE_DIRECTORIES.VEHICLES_IMAGES,
        outputKey,
        optimized.buffer,
        optimized.contentType,
      );

      const finalUrl = this.objectStorageService.buildPublicUrl(
        STORAGE_DIRECTORIES.VEHICLES_IMAGES,
        outputKey,
      );

      this.logger.log(`Imagen subida a ${finalUrl}`);

      await this.vehicleImagesRepo.update(image_id, {
        status: "ready",
        url: finalUrl,
        failure_reason: null,
      });
      await this.invalidateVehicleDetail(vehicle_id);

      try {
        await this.objectStorageService.deleteObjectByKey(source_path);
        this.logger.log(`Archivo fuente borrado: ${source_path}`);
      } catch (deleteError) {
        this.logger.warn(
          `No se pudo borrar el archivo fuente ${source_path}: ${deleteError instanceof Error ? deleteError.message : "Error desconocido"}`,
        );
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

      await this.vehicleImagesRepo.update(image_id, {
        status: "failed",
        failure_reason: errorMessage,
      });
      await this.invalidateVehicleDetail(vehicle_id);

      throw error;
    }
  }
}
