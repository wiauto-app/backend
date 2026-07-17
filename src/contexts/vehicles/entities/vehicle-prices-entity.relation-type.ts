import type { VehiclePriceEntity } from "../vehicle-prices/entities/vehicle-price.entity";

/**
 * Resolución perezosa de la entidad para @OneToMany en VehicleEntity.
 * Un import de valor de vehicle-prices en vehicle.entity reintroduce un ciclo
 * (vehicle -> vehicle_prices -> vehicle) en tiempo de carga.
 */
export const get_vehicle_prices_entity = (): (new () => VehiclePriceEntity) & object => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return
  return require("../vehicle-prices/entities/vehicle-price.entity")
    .VehiclePriceEntity;
};
