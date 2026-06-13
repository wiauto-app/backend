import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { is_temp_storage_path } from "@/src/contexts/shared/file/domain/temp-storage-path";

import { Vehicle, VehicleUpdateFields } from "../../../domain/entities/vehicle";
import { VehicleNotFoundException } from "../../../domain/exceptions/vehicle-not-found.exception";
import { vehicleDetailToPrimitives } from "../../../domain/read-models/vehicle-detail";
import { VehicleRepository } from "../../../domain/repositories/vehicle.repository";
import { AttachVehicleImagesFromTempUseCase } from "../../../vehicle-images/application/attach-vehicle-images-from-temp-use-case/attach-vehicle-images-from-temp.use-case";
import { SetVehiclePriceUseCase } from "../../../vehicle-prices/application/set-vehicle-price-use-case/set-vehicle-price.use-case";
import { UpdateVehicleDto } from "./update-vehicle.dto";
import { VehicleSearchIndexer } from "../../../search/infrastructure/indexing/vehicle-search-indexer.service";
import { ReverseGeocodingPort } from "../../ports/reverse-geocoding.port";
import { formatAddressText } from "../../../infrastructure/services/format-vehicle-address";

@Injectable()
export class UpdateVehicleUseCase {
  constructor(
    private readonly vehicle_repository: VehicleRepository,
    private readonly attach_vehicle_images_from_temp_use_case: AttachVehicleImagesFromTempUseCase,
    private readonly set_vehicle_price_use_case: SetVehiclePriceUseCase,
    private readonly vehicle_search_indexer: VehicleSearchIndexer,
    private readonly reverse_geocoding_port: ReverseGeocodingPort,
  ) {}

  async execute(update_vehicle_dto: UpdateVehicleDto) {
    const existing = await this.vehicle_repository.findOne(update_vehicle_dto.id);
    if (!existing) {
      throw new VehicleNotFoundException(update_vehicle_dto.id);
    }

    const { id, images, price, vehicle_price_id, ...dto_fields } = update_vehicle_dto;

    const patch = Object.fromEntries(
      Object.entries(dto_fields as Record<string, unknown>).filter(
        ([, value]) => value !== undefined,
      ),
    ) as VehicleUpdateFields;

    const coordinates_changed =
      (patch.lat !== undefined && patch.lat !== existing.lat) ||
      (patch.lng !== undefined && patch.lng !== existing.lng);

    if (coordinates_changed) {
      const lat = patch.lat ?? existing.lat;
      const lng = patch.lng ?? existing.lng;
      const resolved = await this.reverse_geocoding_port.resolve(lat, lng);
      patch.address = resolved ? formatAddressText(resolved.formatted_lines) : null;
      patch.address_details = resolved;
    }

    const updated = Vehicle.fromPrimitives(
      vehicleDetailToPrimitives(existing),
    ).applyUpdates(patch);
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

    await this.vehicle_search_indexer.indexVehicle(id);

    return { vehicle: updated.toPrimitives() };
  }
}
