import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock(
  "@/src/contexts/vehicles/api/v1/create-vehicle/create-vehicle.service",
  () => ({
    CreateVehicleService: vi.fn(),
  }),
);

import { DraftVehiclePublicationService } from "@/src/contexts/vehicles/services/draft-vehicle-publication.service";
import { STATUS_VEHICLE } from "@/src/contexts/vehicles/types/vehicle";

describe("DraftVehiclePublicationService", () => {
  it("publica borradores y devuelve el id del más reciente", async () => {
    const draftNewer = {
      id: "draft-new",
      profile_id: "profile-1",
      status: STATUS_VEHICLE.DRAFT,
      created_at: new Date("2026-01-02"),
    };
    const draftOlder = {
      id: "draft-old",
      profile_id: "profile-1",
      status: STATUS_VEHICLE.DRAFT,
      created_at: new Date("2026-01-01"),
    };

    const vehicle_repository = {
      find: vi.fn().mockResolvedValue([draftNewer, draftOlder]),
      preload: vi.fn().mockImplementation(async (partial) => ({
        ...draftNewer,
        ...partial,
      })),
      save: vi.fn().mockResolvedValue(undefined),
    };

    const service = new DraftVehiclePublicationService(
      vehicle_repository as never,
    );

    const publishedId = await service.publishDraftsForProfile("profile-1");

    expect(publishedId).toBe("draft-new");
    expect(vehicle_repository.save).toHaveBeenCalledTimes(2);
  });

  it("devuelve null si no hay borradores", async () => {
    const vehicle_repository = {
      find: vi.fn().mockResolvedValue([]),
    };

    const service = new DraftVehiclePublicationService(
      vehicle_repository as never,
    );

    await expect(service.publishDraftsForProfile("profile-1")).resolves.toBeNull();
  });
});
