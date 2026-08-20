import { describe, expect, it, vi } from "vitest";

import { AttachVehicleImagesFromTempService } from "@/src/contexts/vehicles/vehicle-images/services/attach-vehicle-images-from-temp.service";

const vehicle_id = "797f4ef7-08d3-4408-8d22-f8bd985cc3ac";
const image_id = "223ac813-eb7e-4c0e-9dc4-f8d89c365286";
const temp_path = "vehicles-images/temp/vehicle-gallery/a.webp";

const createService = () => {
  const manager = {
    remove: vi.fn().mockResolvedValue([]),
    save: vi.fn().mockResolvedValue([]),
  };
  const repository = {
    find: vi.fn().mockResolvedValue([]),
    manager: {
      transaction: vi.fn(
        (callback: (transaction_manager: typeof manager) => Promise<void>) =>
          callback(manager),
      ),
    },
  };
  const promotion_service = {
    execute: vi.fn().mockResolvedValue({
      pathnames: ["/vehicles-images/vehicle-gallery/a.webp"],
    }),
    rollback: vi.fn().mockResolvedValue(),
  };

  return {
    service: new AttachVehicleImagesFromTempService(
      promotion_service as never,
      repository as never,
    ),
    manager,
    repository,
    promotion_service,
  };
};

describe("attach vehicle images from temp", () => {
  it("validates image ownership before promoting or deleting anything", async () => {
    const { service, repository, promotion_service } = createService();

    await expect(
      service.execute({
        vehicle_id,
        images: [{ id: image_id, path: temp_path, order: 0 }],
      }),
    ).rejects.toThrow("no pertenece al vehículo");

    expect(promotion_service.execute).not.toHaveBeenCalled();
    expect(repository.manager.transaction).not.toHaveBeenCalled();
  });

  it("restores promoted files when the image transaction fails", async () => {
    const database_error = new Error("image persistence failed");
    const { service, repository, promotion_service } = createService();
    repository.manager.transaction.mockRejectedValueOnce(database_error);

    await expect(
      service.execute({
        vehicle_id,
        images: [{ path: temp_path, order: 0 }],
      }),
    ).rejects.toBe(database_error);

    expect(promotion_service.rollback).toHaveBeenCalledWith({
      paths: [temp_path],
    });
  });
});
