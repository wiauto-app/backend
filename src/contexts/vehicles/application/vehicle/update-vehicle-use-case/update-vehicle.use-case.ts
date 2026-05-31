import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { is_temp_storage_path } from "@/src/contexts/shared/file/domain/temp-storage-path";

import { VehicleUpdateFields } from "../../../domain/entities/vehicle";
import { VehicleNotFoundException } from "../../../domain/exceptions/vehicle-not-found.exception";
import { VehicleRepository } from "../../../domain/repositories/vehicle.repository";
import { AttachVehicleImagesFromTempUseCase } from "../../../vehicle-images/application/attach-vehicle-images-from-temp-use-case/attach-vehicle-images-from-temp.use-case";
import { SetVehiclePriceUseCase } from "../../../vehicle-prices/application/set-vehicle-price-use-case/set-vehicle-price.use-case";
import { UpdateVehicleDto } from "./update-vehicle.dto";

@Injectable()
export class UpdateVehicleUseCase {
  constructor(
    private readonly vehicle_repository: VehicleRepository,
    private readonly attach_vehicle_images_from_temp_use_case: AttachVehicleImagesFromTempUseCase,
    private readonly set_vehicle_price_use_case: SetVehiclePriceUseCase,
  ) {}

  async execute(update_vehicle_dto: UpdateVehicleDto) {
    const existing = await this.vehicle_repository.findOne(update_vehicle_dto.id);
    if (!existing) {
      throw new VehicleNotFoundException(update_vehicle_dto.id);
    }

    const prev = existing.toPrimitives();
    const { id, images, price, vehicle_price_id, ...dto_fields } = update_vehicle_dto;

    const patch: VehicleUpdateFields = {
      ...prev,
      ...Object.fromEntries(
        Object.entries(dto_fields).filter(([, value]) => value !== undefined),
      ),
    };

    const updated = existing.applyUpdates(patch);
    await this.vehicle_repository.update(updated);

    if (price !== undefined || vehicle_price_id !== undefined) {
      await this.set_vehicle_price_use_case.execute({
        vehicle_id: id,
        price,
        vehicle_price_id,
      });
    }

    if (images && images.length > 0) {
      const temp_images = images.filter((image) =>
        is_temp_storage_path(image.path),
      );
      if (temp_images.length > 0) {
        await this.attach_vehicle_images_from_temp_use_case.execute({
          vehicle_id: id,
          images: temp_images,
        });
      }
    }

    return { vehicle: updated.toPrimitives() };
  }
}
