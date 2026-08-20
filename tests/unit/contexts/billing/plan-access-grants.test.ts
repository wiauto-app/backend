import { vi } from "vitest";

vi.mock(
  "@/src/contexts/vehicles/repositories/typeorm.vehicle-repository",
  () => ({
    TypeOrmVehicleRepository: class TypeOrmVehicleRepository {
      readonly mocked = true;
    },
  }),
);

import { EntitlementsService } from "@/src/contexts/billing/services/entitlements.service";
import {
  ENTITLEMENT_FEATURE,
  ENTITLEMENT_VALUE_TYPE,
  limitValue,
} from "@/src/contexts/billing/types/entitlement-features";
import { getLimitFromEntitlement } from "@/src/contexts/billing/types/entitlement-resolve";

const profile_id = "14f04126-a751-4cc0-851a-dfc5c9bf98b0";
const grant_id = "797f4ef7-08d3-4408-8d22-f8bd985cc3ac";
const plan_id = "223ac813-eb7e-4c0e-9dc4-f8d89c365286";
const plan_version_id = "56aa4e9f-19cc-49aa-bb01-50a23c410f46";

const createService = () => {
  const billing_profile_repository = {
    findById: vi.fn().mockResolvedValue({ id: profile_id, is_admin: false }),
  };
  const subscription_repository = {};
  const plan_access_grants_service = {
    findActiveByProfileId: vi.fn().mockResolvedValue({
      id: grant_id,
      profile_id,
      plan_id,
      plan_version_id,
      expires_at: null,
      plan: { name: "Profesional" },
    }),
  };
  const vehicle_repository = {
    count_active_by_profile_id: vi.fn().mockResolvedValue(2),
    count_active_by_profile_ids: vi.fn().mockResolvedValue(2),
  };
  const dealership_members_repository = {
    findOne: vi.fn().mockResolvedValue(null),
  };
  const subscription_entity_repository = {
    findOne: vi.fn().mockResolvedValue(null),
  };
  const plan_entitlement_repository = {
    find: vi.fn().mockResolvedValue([
      {
        feature: ENTITLEMENT_FEATURE.VEHICLES,
        value_type: ENTITLEMENT_VALUE_TYPE.LIMIT,
        value: limitValue(25),
      },
    ]),
  };

  return new EntitlementsService(
    billing_profile_repository as never,
    subscription_repository as never,
    plan_access_grants_service as never,
    vehicle_repository as never,
    dealership_members_repository as never,
    subscription_entity_repository as never,
    plan_entitlement_repository as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
  );
};

describe("administrative plan access grants", () => {
  it("resolves the published plan entitlements without a Stripe subscription", async () => {
    const resolved = await createService().resolve(profile_id);

    expect(resolved.source).toBe("admin_grant");
    expect(resolved.subscription_id).toBeNull();
    expect(resolved.access_grant_id).toBe(grant_id);
    expect(resolved.plan_id).toBe(plan_id);
    expect(resolved.plan_version_id).toBe(plan_version_id);
    expect(
      getLimitFromEntitlement(resolved.features[ENTITLEMENT_FEATURE.VEHICLES]),
    ).toBe(25);
  });
});
