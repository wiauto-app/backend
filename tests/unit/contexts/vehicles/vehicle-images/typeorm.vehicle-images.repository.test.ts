import { vi } from "vitest";

import { TypeOrmVehicleImagesRepository } from "@/src/contexts/vehicles/vehicle-images/repositories/typeorm.vehicle-images.repository";
import { VehicleImage } from "@/src/contexts/vehicles/vehicle-images/types/vehicle-image";

describe("TypeOrmVehicleImagesRepository", () => {
  it("persiste order y vehicle_id al guardar en bloque", async () => {
    const save = vi.fn().mockResolvedValue([]);
    const create = vi.fn((payload: Record<string, unknown>) => payload);
    const vehicleImagesRepository = { save, create } as never;
    const repository = new TypeOrmVehicleImagesRepository(
      vehicleImagesRepository,
      {} as never,
    );

    const vehicle_id = "797f4ef7-08d3-4408-8d22-f8bd985cc3ac";
    await repository.saveBulk([
      VehicleImage.create({
        url: "/vehicles-images/test.webp",
        vehicle_id,
        order: 1,
      }),
    ]);

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        order: 1,
        vehicle_id,
      }),
    );
    expect(save).toHaveBeenCalled();
  });
});