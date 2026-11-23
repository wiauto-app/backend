import { vi } from "vitest";

vi.mock(
  "@/src/contexts/vehicles/repositories/typeorm.vehicle-repository",
  () => ({
    TypeOrmVehicleRepository: class TypeOrmVehicleRepository {
      readonly mocked = true;
    },
  }),
);

import { DealershipService } from "@/src/contexts/dealership/services/dealership.service";

const profile_id = "14f04126-a751-4cc0-851a-dfc5c9bf98b0";
const plan_id = "223ac813-eb7e-4c0e-9dc4-f8d89c365286";

const createService = (
  membership: {
    role: "owner" | "admin" | "member";
    billing_plan_id?: string | null;
  } | null,
) => {
  const dealership_repository = {
    updateBillingPlanId: vi.fn().mockResolvedValue(),
  };
  const member_repository = {
    findOneByProfileId: vi
      .fn()
      .mockResolvedValue(
        membership ? { dealership_id: "d-1", role: membership.role } : null,
      ),
    findOneWithDealershipByProfileId: vi.fn().mockResolvedValue(
      membership
        ? {
            dealership_id: "d-1",
            role: membership.role,
            dealership: {
              name: "Motor Sur",
              billing_plan_id: membership.billing_plan_id ?? null,
            },
          }
        : null,
    ),
  };
  const service = new DealershipService(
    dealership_repository as never,
    member_repository as never,
    {} as never,
    {} as never,
    {} as never,
    {
      findOne: vi.fn().mockResolvedValue({
        name: "Ana",
        last_name: "García",
        phone_code: null,
        phone: null,
        user: { email: "ana@example.com" },
      }),
    } as never,
    {} as never,
    { syncForProfile: vi.fn().mockResolvedValue() } as never,
  );
  const create = vi
    .spyOn(service, "create")
    .mockResolvedValue({} as never);

  return { service, dealership_repository, create };
};

describe("DealershipService.ensureForProfile", () => {
  it("no crea nada si el perfil ya pertenece a un concesionario", async () => {
    const { service, create } = createService({ role: "owner" });

    await service.ensureForProfile(profile_id, {
      name: "Otro",
      email: "otro@example.com",
      phone_code: "+34",
      phone: "600111222",
      address: "Calle Mayor 1",
    });

    expect(create).not.toHaveBeenCalled();
  });

  it("crea con los datos mínimos recibidos y el perfil como owner", async () => {
    const { service, create } = createService(null);

    await service.ensureForProfile(profile_id, {
      name: " Motor Sur ",
      email: "contacto@motorsur.es",
      phone_code: "+34",
      phone: "600111222",
      address: " Calle Mayor 1, Sevilla ",
    });

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Motor Sur",
        address: "Calle Mayor 1, Sevilla",
        show_phone: true,
        members: [{ profile_id, role: "owner" }],
      }),
    );
  });

  it("sin datos crea el stub a partir del perfil", async () => {
    const { service, create } = createService(null);

    await service.ensureForProfile(profile_id);

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Ana García",
        email: "ana@example.com",
        address: "Pendiente de completar",
      }),
    );
  });
});

describe("DealershipService billing plan", () => {
  it("solo el propietario vincula el plan", async () => {
    const { service, dealership_repository } = createService({ role: "member" });

    await service.linkBillingPlanForProfile(profile_id, plan_id);

    expect(dealership_repository.updateBillingPlanId).not.toHaveBeenCalled();
  });

  it("desvincula solo si el plan actual coincide", async () => {
    const matching = createService({ role: "owner", billing_plan_id: plan_id });
    await matching.service.unlinkBillingPlanForProfile(profile_id, plan_id);
    expect(matching.dealership_repository.updateBillingPlanId).toHaveBeenCalledWith(
      "d-1",
      null,
    );

    const other = createService({ role: "owner", billing_plan_id: "otro-plan" });
    await other.service.unlinkBillingPlanForProfile(profile_id, plan_id);
    expect(other.dealership_repository.updateBillingPlanId).not.toHaveBeenCalled();
  });
});
