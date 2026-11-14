/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { vi } from "vitest";

vi.mock(
  "@/src/contexts/vehicles/repositories/typeorm.vehicle-repository",
  () => ({
    TypeOrmVehicleRepository: class TypeOrmVehicleRepository {
      readonly mocked = true;
    },
  }),
);

import { VEHICLE_POST_COMMIT_RELOCATE_IMAGE_CONCURRENCY } from "@/src/contexts/vehicles/queues/vehicle-post-commit.queue.constants";
import { VehiclePostCommitService } from "@/src/contexts/vehicles/services/vehicle-post-commit.service";

const buildService = (
  overrides: Partial<{
    relocate: { execute: ReturnType<typeof vi.fn> };
    temp_repo: { findBy: ReturnType<typeof vi.fn> };
    images_repo: { update: ReturnType<typeof vi.fn> };
    image_queue: { addBulk: ReturnType<typeof vi.fn> };
  }> = {},
) =>
  new VehiclePostCommitService(
    (overrides.relocate ?? {
      execute: vi.fn().mockResolvedValue({
        sourcePath: "vehicles-images/source.webp",
        outputKey: "vehicle-id/image.webp",
      }),
    }) as never,
    { update: overrides.images_repo?.update ?? vi.fn().mockResolvedValue({}) } as never,
    {
      findBy:
        overrides.temp_repo?.findBy ??
        vi.fn().mockResolvedValue([
          {
            id: "upload-0",
            storage_path: "temp/0.webp",
            mime_type: "image/webp",
          },
          {
            id: "upload-1",
            storage_path: "temp/1.webp",
            mime_type: "image/webp",
          },
        ]),
    } as never,
    { findBy: vi.fn() } as never,
    (overrides.image_queue ?? {
      addBulk: vi.fn().mockResolvedValue(undefined),
    }) as never,
    { relocateAndEnqueue: vi.fn() } as never,
    {
      runDraftRegistrationSideEffects: vi.fn(),
      runPublishSideEffects: vi.fn(),
    } as never,
    { indexVehicle: vi.fn() } as never,
    { refresh: vi.fn() } as never,
    { findOne: vi.fn() } as never,
  );

describe("VehiclePostCommitService.relocateImages", () => {
  it("procesa en lotes y marca failed sin tumbar el resto", async () => {
    const relocate_execute = vi
      .fn()
      .mockResolvedValueOnce({
        sourcePath: "vehicles-images/ok.webp",
        outputKey: "vehicle-id/ok.webp",
      })
      .mockRejectedValueOnce(new Error("R2 no disponible"));
    const images_repo_update = vi.fn().mockResolvedValue({});
    const image_queue_add_bulk = vi.fn().mockResolvedValue(undefined);

    const service = buildService({
      relocate: { execute: relocate_execute },
      images_repo: { update: images_repo_update },
      image_queue: { addBulk: image_queue_add_bulk },
    });

    const images = Array.from({ length: 2 }, (_, index) => ({
      image_id: `image-${index}`,
      upload_id: `upload-${index}`,
      order: index,
    }));

    await service.relocateImages("vehicle-id", images);

    expect(relocate_execute).toHaveBeenCalledTimes(2);
    expect(images_repo_update).toHaveBeenCalledWith("image-1", {
      status: "failed",
      failure_reason: "R2 no disponible",
    });
    expect(image_queue_add_bulk).toHaveBeenCalledTimes(1);
    expect(image_queue_add_bulk.mock.calls[0][0]).toHaveLength(1);
  });

  it("usa lotes de concurrencia 6", () => {
    expect(VEHICLE_POST_COMMIT_RELOCATE_IMAGE_CONCURRENCY).toBe(6);
  });
});