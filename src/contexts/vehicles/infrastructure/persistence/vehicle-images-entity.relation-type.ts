import type { VehicleImagesEntity } from "../../vehicle-images/infrastructure/persistence/vehicle-images.entity";

/**
 * Resolución perezosa de la entidad para @OneToMany en VehicleEntity.
 * Un import de valor de vehicle-images en vehicle.entity reintroduce un ciclo
 * (vehicle -> vehicle_images -> vehicle) en tiempo de carga.
 */
export const get_vehicle_images_entity = (): (new () => VehicleImagesEntity) & object => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return
  return require("../../vehicle-images/infrastructure/persistence/vehicle-images.entity")
    .VehicleImagesEntity;
};
