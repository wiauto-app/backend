import { ConflictException } from "@nestjs/common";
import { vi } from "vitest";

vi.mock(
  "@/src/contexts/vehicles/repositories/typeorm.vehicle-repository",
  () => ({
    TypeOrmVehicleRepository: class TypeOrmVehicleRepository {
      readonly mocked = true;
    },
  }),
);

import { PlanAccessGrantsService } from "@/src/contexts/billing/services/plan-access-grants.service";
import { PLAN_AUDIENCE } from "@/src/contexts/billing/types/billing.enums";

const profile_id = "14f04126-a751-4cc0-851a-dfc5c9bf98b0";
const admin_id = "5b1c6b3e-8a6f-4a0b-9d0e-2f4f6c1a7b10";
const dealership_plan_id = "223ac813-eb7e-4c0e-9dc4-f8d89c365286";
const particular_plan_id = "0c4a3b1e-1f2d-4c5b-8a9e-6d7f8a9b0c1d";

const minimal_dealership = {
  name: "Motor Sur",
  email: "contacto@motorsur.es",
  phone_code: "+34",
  phone: "600111222",
  address: "Calle Mayor 1, Sevilla",
};

const plans: Record<string, { id: string; name: string; audience: string }> = {
  [dealership_plan_id]: {
    id: dealership_plan_id,
    name: "Concesionario Pro",
    audience: PLAN_AUDIENCE.DEALERSHIP,
  },
  [particular_plan_id]: {
    id: particular_plan_id,
    name: "Particular",
    audience: PLAN_AUDIENCE.PARTICULAR,
  },
};

const createService = (
  options: {
    membership?: { role: "owner" | "admin" | "member"; dealership_name: string } | null;
    active_grant?: { plan_id: string } | null;
    has_paid_subscription?: boolean;
  } = {},
) => {
  const calls: string[] = [];
  const saved_grants: Record<string, unknown>[] = [];

  const dealership_service = {
    findMembershipSummaryByProfileId: vi.fn().mockResolvedValue(
      options.membership
        ? {
            dealership_id: "d-1",
            dealership_name: options.membership.dealership_name,
            billing_plan_id: null,
            role: options.membership.role,
          }
        : null,
    ),
    ensureForProfile: vi.fn().mockImplementation(() => {
      calls.push("ensureForProfile");
      return Promise.resolve();
    }),
    linkBillingPlanForProfile: vi.fn().mockImplementation(() => {
      calls.push("linkBillingPlanForProfile");
      return Promise.resolve();
    }),
    unlinkBillingPlanForProfile: vi.fn().mockResolvedValue(),
  };

  const grant_repository_in_tx = {
    update: vi.fn().mockResolvedValue(),
    save: vi.fn().mockImplementation((grant: Record<string, unknown>) => {
      calls.push("saveGrant");
      saved_grants.push(grant);
      return Promise.resolve({ id: "grant-1", ...grant });
    }),
  };
  const data_source = {
    transaction: vi.fn().mockImplementation((work: (m: unknown) => unknown) =>
      work({ getRepository: () => grant_repository_in_tx }),
    ),
  };

  const grant_repository = {
    findOne: vi
      .fn()
      .mockResolvedValue(
        options.active_grant
          ? { id: "grant-0", plan_id: options.active_grant.plan_id }
          : null,
      ),
    findOneOrFail: vi.fn().mockImplementation(() => Promise.resolve({
      id: "grant-1",
      profile_id,
      plan_id: saved_grants.at(-1)?.plan_id,
      plan_version_id: "v-1",
      reason: null,
      expires_at: null,
      created_at: new Date(),
      plan: plans[saved_grants.at(-1)?.plan_id as string],
      plan_version: { version: 1 },
    })),
    update: vi.fn().mockResolvedValue(),
    find: vi.fn().mockResolvedValue([]),
  };

  const service = new PlanAccessGrantsService(
    data_source as never,
    { findPublishedByPlanId: vi.fn().mockResolvedValue({ id: "v-1" }) } as never,
    dealership_service as never,
    { exists: vi.fn().mockResolvedValue(true) } as never,
    grant_repository as never,
    {
      findOne: vi
        .fn()
        .mockImplementation(({ where }: { where: { id: string } }) =>
          Promise.resolve(plans[where.id] ?? null),
        ),
    } as never,
    {
      exists: vi.fn().mockResolvedValue(options.has_paid_subscription === true),
    } as never,
    { syncForProfile: vi.fn().mockResolvedValue() } as never,
  );

  return { service, dealership_service, grant_repository, calls, saved_grants };
};

describe("PlanAccessGrantsService.assign", () => {
  it("crea el concesionario con los datos mínimos antes de guardar el grant", async () => {
    const { service, dealership_service, calls } = createService();

    await service.assign({
      profile_id,
      plan_id: dealership_plan_id,
      granted_by_user_id: admin_id,
      dealership: minimal_dealership,
    });

    expect(dealership_service.ensureForProfile).toHaveBeenCalledWith(
      profile_id,
      minimal_dealership,
    );
    expect(calls).toEqual([
      "ensureForProfile",
      "saveGrant",
      "linkBillingPlanForProfile",
    ]);
  });

  it("no guarda el grant si falla la creación del concesionario", async () => {
    const { service, dealership_service, saved_grants } = createService();
    dealership_service.ensureForProfile.mockRejectedValueOnce(new Error("boom"));

    await expect(
      service.assign({
        profile_id,
        plan_id: dealership_plan_id,
        granted_by_user_id: admin_id,
        dealership: minimal_dealership,
      }),
    ).rejects.toThrow("boom");
    expect(saved_grants).toHaveLength(0);
  });

  it("rechaza con 409 si el usuario es miembro no propietario", async () => {
    const { service, dealership_service, saved_grants } = createService({
      membership: { role: "member", dealership_name: "Motor Sur" },
    });

    await expect(
      service.assign({
        profile_id,
        plan_id: dealership_plan_id,
        granted_by_user_id: admin_id,
      }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(dealership_service.ensureForProfile).not.toHaveBeenCalled();
    expect(saved_grants).toHaveLength(0);
  });

  it("ignora los datos de concesionario en un plan particular", async () => {
    const { service, dealership_service } = createService();

    await service.assign({
      profile_id,
      plan_id: particular_plan_id,
      granted_by_user_id: admin_id,
      dealership: minimal_dealership,
    });

    expect(dealership_service.ensureForProfile).not.toHaveBeenCalled();
    expect(dealership_service.linkBillingPlanForProfile).not.toHaveBeenCalled();
  });

  it("libera el plan del concesionario al cambiar a un plan particular", async () => {
    const { service, dealership_service } = createService({
      active_grant: { plan_id: dealership_plan_id },
    });

    await service.assign({
      profile_id,
      plan_id: particular_plan_id,
      granted_by_user_id: admin_id,
    });

    expect(dealership_service.unlinkBillingPlanForProfile).toHaveBeenCalledWith(
      profile_id,
      dealership_plan_id,
    );
  });
});

describe("PlanAccessGrantsService.revoke", () => {
  it("libera el plan del concesionario si no hay suscripción de pago", async () => {
    const { service, dealership_service } = createService({
      active_grant: { plan_id: dealership_plan_id },
    });

    await service.revoke(profile_id, admin_id);

    expect(dealership_service.unlinkBillingPlanForProfile).toHaveBeenCalledWith(
      profile_id,
      dealership_plan_id,
    );
  });

  it("mantiene el plan si hay una suscripción de pago vigente", async () => {
    const { service, dealership_service } = createService({
      active_grant: { plan_id: dealership_plan_id },
      has_paid_subscription: true,
    });

    await service.revoke(profile_id, admin_id);

    expect(dealership_service.unlinkBillingPlanForProfile).not.toHaveBeenCalled();
  });
});

describe("PlanAccessGrantsService.processExpiredGrants", () => {
  it("libera y marca los grants vencidos una sola vez", async () => {
    const { service, dealership_service, grant_repository } = createService();
    const now = new Date("2026-11-23T03:00:00Z");
    grant_repository.find
      .mockResolvedValueOnce([
        { id: "g-exp", profile_id, plan_id: dealership_plan_id },
      ])
      .mockResolvedValueOnce([]);

    const processed = await service.processExpiredGrants(now);

    expect(processed).toBe(1);
    expect(dealership_service.unlinkBillingPlanForProfile).toHaveBeenCalledWith(
      profile_id,
      dealership_plan_id,
    );
    expect(grant_repository.update).toHaveBeenCalledWith("g-exp", {
      expired_processed_at: now,
    });
  });

  it("no libera si el perfil ya tiene otro grant vigente del mismo plan", async () => {
    const { service, dealership_service, grant_repository } = createService({
      active_grant: { plan_id: dealership_plan_id },
    });
    grant_repository.find.mockResolvedValueOnce([
      { id: "g-exp", profile_id, plan_id: dealership_plan_id },
    ]);

    await service.processExpiredGrants(new Date());

    expect(dealership_service.unlinkBillingPlanForProfile).not.toHaveBeenCalled();
    expect(grant_repository.update).toHaveBeenCalledTimes(1);
  });
});
