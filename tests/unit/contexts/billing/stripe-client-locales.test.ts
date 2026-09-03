import { beforeEach, describe, expect, it, vi } from "vitest";

const stripeMocks = vi.hoisted(() => ({
  customersCreate: vi.fn(),
  customersUpdate: vi.fn(),
  sessionsCreate: vi.fn(),
}));

vi.mock("stripe", () => ({
  default: class Stripe {
    customers = {
      create: stripeMocks.customersCreate,
      update: stripeMocks.customersUpdate,
    };
    checkout = {
      sessions: {
        create: stripeMocks.sessionsCreate,
      },
    };

    constructor(_key: string) {}
  },
}));

import { StripeClient } from "@/src/contexts/billing/clients/stripe.client";

describe("StripeClient locales", () => {
  let client: StripeClient;

  beforeEach(() => {
    vi.clearAllMocks();
    client = new StripeClient();
    stripeMocks.customersCreate.mockResolvedValue({ id: "cus_1" });
    stripeMocks.customersUpdate.mockResolvedValue({ id: "cus_1" });
    stripeMocks.sessionsCreate.mockResolvedValue({
      url: "https://checkout.stripe.com/test",
    });
  });

  it("crea customer con preferred_locales es", async () => {
    await client.createCustomer({
      email: "user@example.com",
      name: "Usuario",
      profile_id: "profile-1",
    });

    expect(stripeMocks.customersCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        preferred_locales: ["es"],
        email: "user@example.com",
      }),
    );
  });

  it("actualiza preferred_locales del customer existente", async () => {
    await client.updateCustomerPreferredLocales("cus_1");

    expect(stripeMocks.customersUpdate).toHaveBeenCalledWith("cus_1", {
      preferred_locales: ["es"],
    });
  });

  it("crea checkout de suscripción con locale es", async () => {
    await client.createSubscriptionCheckout({
      customer_id: "cus_1",
      stripe_price_id: "price_1",
      profile_id: "profile-1",
      plan_id: "plan-1",
      plan_price_id: "plan-price-1",
      plan_version_id: "version-1",
    });

    expect(stripeMocks.sessionsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: "subscription",
        locale: "es",
      }),
    );
  });

  it("crea checkout guest con locale es", async () => {
    await client.createGuestSubscriptionCheckout({
      stripe_price_id: "price_1",
      plan_id: "plan-1",
      plan_price_id: "plan-price-1",
      plan_version_id: "version-1",
    });

    expect(stripeMocks.sessionsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: "subscription",
        locale: "es",
      }),
    );
  });

  it("crea checkout one-time con locale es", async () => {
    await client.createOneTimeCheckout({
      customer_id: "cus_1",
      stripe_price_id: "price_1",
      profile_id: "profile-1",
    });

    expect(stripeMocks.sessionsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: "payment",
        locale: "es",
      }),
    );
  });
});
