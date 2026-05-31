import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";

import { VehiclePriceRepository } from "../../domain/vehicle-price.repository";

@Injectable()
export class FindVehiclePricesByVehicleIdUseCase {
  constructor(
    private readonly vehicle_price_repository: VehiclePriceRepository,
  ) {}

  async execute(vehicle_id: string) {
    const prices = await this.vehicle_price_repository.findByVehicleId(vehicle_id);
    return prices.map((price) => price.toPrimitives());
  }
}
