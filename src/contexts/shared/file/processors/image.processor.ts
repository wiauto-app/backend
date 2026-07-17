import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Logger } from "@nestjs/common";
import { Job } from "bullmq";

import { VehicleImage } from "@/src/contexts/vehicles/vehicle-images/types/vehicle-image";
import { TypeOrmVehicleImagesRepository } from "@/src/contexts/vehicles/vehicle-images/repositories/typeorm.vehicle-images.repository";

import { UploadJob } from "../ports/file-queue.port";
import { UploadImageService } from "../services/upload-image.service";
import { UPLOAD_IMAGE_QUEUE } from "../media.constants";

function queuedPayloadsToMulterFiles(job: UploadJob["files"]): Express.Multer.File[] {
  return job.map((f) => {
    const buffer = Buffer.from(f.contentBase64, "base64");
    return {
      fieldname: "files",
      originalname: f.originalname,
      encoding: "7bit",
      mimetype: f.mimetype,
      buffer,
      size: buffer.length,
      destination: "",
      filename: f.originalname,
      path: "",
    } as Express.Multer.File;
  });
}

@Processor(UPLOAD_IMAGE_QUEUE)
export class ImageProcessor extends WorkerHost {
  private readonly logger = new Logger(ImageProcessor.name);

  constructor(
    private readonly upload_image_use_case: UploadImageService,
    private readonly vehicleImageRepository: TypeOrmVehicleImagesRepository,
  ) {
    super();
  }

  async process(job: Job<UploadJob>): Promise<void> {
    try {
      const { files: payloads, path, entity, entityId } = job.data;
      const files = queuedPayloadsToMulterFiles(payloads);
      const urls = await this.upload_image_use_case.execute(files, path, "queued");

      if (entity === "vehicle") {
        this.logger.log(`Saving ${urls.length} vehicle images for vehicle ${entityId}`);
        await this.vehicleImageRepository.saveBulk(
          urls.map((url) => VehicleImage.create({ url, vehicle_id: entityId })),
        );
      }

      this.logger.log(`Images uploaded successfully for ${entity} ${entityId}`);
    } catch (error) {
      this.logger.error(`Error uploading images: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }
}
