
import { FileQueuePort } from "@/src/contexts/shared/file/domain/ports/file-queue.port";

import { BulkVehicleImagesDto } from "./bulk-vehicle-images.dto";
import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";

@Injectable()
export class BulkVehicleImagesUseCase {
  constructor(private readonly fileQueuePort: FileQueuePort) {}

  async execute(bulkVehicleImagesDto: BulkVehicleImagesDto): Promise<{ message: string }> {
    await this.fileQueuePort.enqueue({
      files: bulkVehicleImagesDto.files.map((f) => ({
        originalname: f.originalname,
        mimetype: f.mimetype,
        contentBase64: f.buffer.toString("base64"),
      })),
      path: `vehicles/${bulkVehicleImagesDto.vehicle_id}`,
      entity: "vehicle",
      entityId: bulkVehicleImagesDto.vehicle_id,
    });

    return { message: "Las imágenes se están subiendo en segundo plano" };
  }
}
