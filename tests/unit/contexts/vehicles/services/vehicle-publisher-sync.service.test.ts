import { describe, expect, it, vi } from "vitest";

import { VehiclePublisherSyncService } from "@/src/contexts/vehicles/services/vehicle-publisher-sync.service";
import { PUBLISHER_TYPE } from "@/src/contexts/vehicles/types/vehicle";

const profile_id = "14f04126-a751-4cc0-851a-dfc5c9bf98b0";
const dealership_id = "223ac813-eb7e-4c0e-9dc4-f8d89c365286";
const stale_vehicle_id = "797f4ef7-08d3-4408-8d22-f8bd985cc3ac";
const current_vehicle_id = "56aa4e9f-19cc-49aa-bb01-50a23c410f46";

describe("VehiclePublisherSyncService", () => {
  const createService = (membership: { dealership_id: string } | null) => {
    const dealership_member_repository = {
      findOneByProfileId: vi.fn().mockResolvedValue(membership),
    };
    const vehicle_repository = {
      find: vi.fn().mockResolvedValue([
        {
          id: stale_vehicle_id,
          publisher_type: PUBLISHER_TYPE.PARTICULAR,
          dealership_id: null,
        },
        {
          id: current_vehicle_id,
          publisher_type: membership
            ? PUBLISHER_TYPE.DEALERSHIP
            : PUBLISHER_TYPE.PARTICULAR,
          dealership_id: membership?.dealership_id ?? null,
        },
      ]),
      preload: vi.fn(async (payload: { id: string }) => payload),
      save: vi.fn(async (payload: { id: string }) => payload),
    };
    const vehicle_detail_cache = {
      invalidate: vi.fn(),
    };

    const service = new VehiclePublisherSyncService(
      dealership_member_repository as never,
      vehicle_repository as never,
      vehicle_detail_cache as never,
    );

    return { service, vehicle_repository, vehicle_detail_cache };
  };

  it("copia la membresía actual y no reescribe anuncios que ya coinciden", async () => {
    const { service, vehicle_repository, vehicle_detail_cache } = createService({
      dealership_id,
    });

    await service.syncForProfile(profile_id);

    expect(vehicle_repository.find).toHaveBeenCalledWith({
      where: { profile_id },
      select: {
        id: true,
        publisher_type: true,
        dealership_id: true,
      },
    });
    expect(vehicle_repository.preload).toHaveBeenCalledTimes(1);
    expect(vehicle_repository.preload).toHaveBeenCalledWith({
      id: stale_vehicle_id,
      publisher_type: PUBLISHER_TYPE.DEALERSHIP,
      dealership_id,
    });
    expect(vehicle_repository.save).toHaveBeenCalledTimes(1);
    expect(vehicle_detail_cache.invalidate).toHaveBeenCalledWith(stale_vehicle_id);
    expect(vehicle_detail_cache.invalidate).not.toHaveBeenCalledWith(
      current_vehicle_id,
    );
  });

  it("vuelve a particular y limpia dealership_id si no hay membresía", async () => {
    const { service, vehicle_repository, vehicle_detail_cache } =
      createService(null);
    vehicle_repository.find.mockResolvedValue([
      {
        id: stale_vehicle_id,
        publisher_type: PUBLISHER_TYPE.DEALERSHIP,
        dealership_id,
      },
    ]);

    await service.syncForProfile(profile_id);

    expect(vehicle_repository.preload).toHaveBeenCalledWith({
      id: stale_vehicle_id,
      publisher_type: PUBLISHER_TYPE.PARTICULAR,
      dealership_id: null,
    });
    expect(vehicle_detail_cache.invalidate).toHaveBeenCalledWith(stale_vehicle_id);
  });
});
