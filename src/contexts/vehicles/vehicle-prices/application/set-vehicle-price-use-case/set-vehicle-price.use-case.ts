import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";

import { VehiclePriceNotFoundException } from "../../domain/exceptions/vehicle-price-not-found.exception";
import { VehiclePrice, VEHICLE_PRICE_STATUS } from "../../domain/vehicle-price";
import { VehiclePriceRepository } from "../../domain/vehicle-price.repository";
import { SetVehiclePriceDto } from "./set-vehicle-price.dto";

@Injectable()
export class SetVehiclePriceUseCase {
  constructor(
    private readonly vehicle_price_repository: VehiclePriceRepository,
  ) {}

  async execute(dto: SetVehiclePriceDto): Promise<void> {
    const { vehicle_id, price, vehicle_price_id } = dto;

    if (vehicle_price_id) {
      const existing = await this.vehicle_price_repository.findOneByIdAndVehicleId(
        vehicle_price_id,
        vehicle_id,
      );
      if (!existing) {
        throw new VehiclePriceNotFoundException(vehicle_price_id, vehicle_id);
      }
      await this.vehicle_price_repository.activatePrice(vehicle_id, vehicle_price_id);
      return;
    }

    if (price === undefined) {
      return;
    }

    const active = await this.vehicle_price_repository.findActiveByVehicleId(vehicle_id);
    if (active?.toPrimitives().price === price) {
      return;
    }

    const new_price = VehiclePrice.create({
      price,
      vehicle_id,
      status: VEHICLE_PRICE_STATUS.ACTIVE,
    });
    await this.vehicle_price_repository.create(new_price);
  }
}
