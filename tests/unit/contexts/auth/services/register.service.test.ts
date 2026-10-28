import { describe, expect, it, vi } from "vitest";

vi.mock("@/src/contexts/users/services/user.service", () => ({
  UserService: vi.fn(),
}));
vi.mock("@/src/contexts/auth/services/auth-security-mail.service", () => ({
  AuthSecurityMailService: vi.fn(),
}));
vi.mock("@/src/contexts/referrals/services/referrals.service", () => ({
  ReferralsService: vi.fn(),
}));
vi.mock(
  "@/src/contexts/vehicles/services/pending-vehicle-creation-enqueue.service",
  () => ({
    PendingVehicleCreationEnqueueService: vi.fn(),
  }),
);

import { RegisterService } from "@/src/contexts/auth/services/register.service";

describe("RegisterService", () => {
  const baseDto = {
    email: "test@example.com",
    password: "secret12",
    name: "Test",
    last_name: "User",
    phone_code: "+34",
    phone: "600000000",
  };

  const buildService = (overrides: Partial<Record<string, unknown>> = {}) => {
    const userService = {
      create: vi.fn().mockResolvedValue({
        ok: true,
        data: { id: "user-1", created_at: new Date() },
      }),
      ...(overrides.userService as object),
    };
    const referrals_service = {
      ensureReferralCodeForProfile: vi.fn().mockResolvedValue("ref-code"),
    };
    const pending_vehicle_creation_enqueue_service = {
      enqueueForProfile: vi.fn().mockResolvedValue(undefined),
      ...(overrides.pending_vehicle_creation_enqueue_service as object),
    };
    const authSecurityMailService = {
      enqueueNewUserRegistered: vi.fn(),
    };

    const service = new RegisterService(
      userService as never,
      authSecurityMailService as never,
      referrals_service as never,
      pending_vehicle_creation_enqueue_service as never,
    );

    return {
      service,
      pending_vehicle_creation_enqueue_service,
    };
  };

  it("encola el borrador cuando pending_vehicle está presente", async () => {
    const { service, pending_vehicle_creation_enqueue_service } =
      buildService();
    const pending_vehicle = { price: 10000, mileage: 1000 } as never;

    const response = await service.register(
      { ...baseDto, pending_vehicle },
      "guest-1",
    );

    expect(response.pending_vehicle_queued).toBe(true);
    expect(
      pending_vehicle_creation_enqueue_service.enqueueForProfile,
    ).toHaveBeenCalledWith("user-1", "guest-1", pending_vehicle);
  });

  it("no falla el registro si el enqueue falla", async () => {
    const { service } = buildService({
      pending_vehicle_creation_enqueue_service: {
        enqueueForProfile: vi
          .fn()
          .mockRejectedValue(new Error("Redis no disponible")),
      },
    });

    const response = await service.register(
      { ...baseDto, pending_vehicle: { price: 1 } as never },
      null,
    );

    expect(response.ok).toBe(true);
    expect(response.pending_vehicle_error).toContain("Redis");
    expect(response.pending_vehicle_queued).toBeUndefined();
  });
});
