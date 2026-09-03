import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock(
  "@/src/contexts/vehicles/repositories/typeorm.vehicle-repository",
  () => ({
    TypeOrmVehicleRepository: class TypeOrmVehicleRepository {
      readonly mocked = true;
    },
  }),
);

import { BillingSubscriptionProvisioningService } from "@/src/contexts/billing/services/billing-subscription-provisioning.service";

const profile_id = "14f04126-a751-4cc0-851a-dfc5c9bf98b0";
const professional_account_id = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";
const stripe_customer_id = "cus_test_123";

describe("BillingSubscriptionProvisioningService.linkProfessionalAccount", () => {
  const professional_account_repository = {
    findOne: vi.fn(),
    preload: vi.fn(),
    save: vi.fn(),
  };

  const createService = () =>
    new BillingSubscriptionProvisioningService(
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      professional_account_repository as never,
    );

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("actualiza stripe_customer_id por professional_account_id de metadata", async () => {
    professional_account_repository.findOne.mockResolvedValue({
      id: professional_account_id,
      profile_id,
    });
    professional_account_repository.preload.mockResolvedValue({
      id: professional_account_id,
      stripe_customer_id,
    });
    professional_account_repository.save.mockResolvedValue({
      id: professional_account_id,
      stripe_customer_id,
    });

    await createService().linkProfessionalAccount(
      profile_id,
      stripe_customer_id,
      professional_account_id,
    );

    expect(professional_account_repository.findOne).toHaveBeenCalledWith({
      where: { id: professional_account_id },
    });
    expect(professional_account_repository.preload).toHaveBeenCalledWith({
      id: professional_account_id,
      stripe_customer_id,
    });
    expect(professional_account_repository.save).toHaveBeenCalled();
  });

  it("busca por profile_id si no hay professional_account_id", async () => {
    professional_account_repository.findOne.mockResolvedValue({
      id: professional_account_id,
      profile_id,
    });
    professional_account_repository.preload.mockResolvedValue({
      id: professional_account_id,
      stripe_customer_id,
    });
    professional_account_repository.save.mockResolvedValue({
      id: professional_account_id,
      stripe_customer_id,
    });

    await createService().linkProfessionalAccount(profile_id, stripe_customer_id);

    expect(professional_account_repository.findOne).toHaveBeenCalledWith({
      where: { profile_id },
    });
    expect(professional_account_repository.save).toHaveBeenCalled();
  });

  it("no hace nada si no existe cuenta profesional", async () => {
    professional_account_repository.findOne.mockResolvedValue(null);

    await createService().linkProfessionalAccount(profile_id, stripe_customer_id);

    expect(professional_account_repository.preload).not.toHaveBeenCalled();
    expect(professional_account_repository.save).not.toHaveBeenCalled();
  });
});
