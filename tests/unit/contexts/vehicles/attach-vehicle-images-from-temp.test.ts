import { describe, expect, it, vi } from "vitest";

import { AttachVehicleImagesFromTempService } from "@/src/contexts/vehicles/vehicle-images/services/attach-vehicle-images-from-temp.service";

const vehicle_id = "797f4ef7-08d3-4408-8d22-f8bd985cc3ac";
const image_id = "223ac813-eb7e-4c0e-9dc4-f8d89c365286";
const temp_path = "vehicles-images/temp/vehicle-gallery/a.webp";

const createService = () => {
  const manager = {
    remove: vi.fn().mockResolvedValue([]),
    create: vi.fn((_entity, payload) => payload),
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
  const vehicle_repository = {
    findOne: vi.fn().mockResolvedValue({
      id: vehicle_id,
      profile_id: "4d5e6f70-8192-4a3b-8c4d-5e6f708192a3",
    }),
  };
  const promotion_service = {
    execute: vi.fn().mockResolvedValue({
      pathnames: ["/vehicles-images/vehicle-gallery/a.webp"],
    }),
    rollback: vi.fn().mockResolvedValue(),
  };
  const temp_upload_service = {
    validateAndGetTempUpload: vi.fn(),
    markAsConsumed: vi.fn(),
  };
  return {
    temp_upload_service,
    service: new AttachVehicleImagesFromTempService(
      promotion_service as never,
      temp_upload_service as never,
      repository as never,
      vehicle_repository as never,
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

  it("devuelve pending_images al adjuntar solo upload_id", async () => {
    const upload_id = "33333333-3333-4333-8333-333333333333";
    const saved_image_id = "44444444-4444-4444-8444-444444444444";
    const temp_upload = { id: upload_id, storage_path: "vehicles-images/temp/x.webp" };
    const { service, manager, temp_upload_service } = createService();

    temp_upload_service.validateAndGetTempUpload.mockResolvedValue(temp_upload);
    manager.save.mockResolvedValue({
      id: saved_image_id,
      order: 0,
    });

    const result = await service.execute({
      vehicle_id,
      images: [{ upload_id, order: 0 }],
    });

    expect(result.pending_images).toEqual([
      {
        image_id: saved_image_id,
        upload_id,
        order: 0,
      },
    ]);
    expect(temp_upload_service.markAsConsumed).toHaveBeenCalledWith(
      [upload_id],
      expect.anything(),
    );
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
