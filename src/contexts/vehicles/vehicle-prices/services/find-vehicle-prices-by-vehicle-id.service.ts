import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";

import { TypeOrmVehiclePriceRepository } from "@/src/contexts/vehicles/vehicle-prices/repositories/typeorm.vehicle-price.repository";

@Injectable()
export class FindVehiclePricesByVehicleIdService {
  constructor(
    private readonly vehicle_price_repository: TypeOrmVehiclePriceRepository,
  ) {}

  async execute(vehicle_id: string) {
    const prices = await this.vehicle_price_repository.findByVehicleId(vehicle_id);
    return prices.map((price) => price.toPrimitives());
  }
}
