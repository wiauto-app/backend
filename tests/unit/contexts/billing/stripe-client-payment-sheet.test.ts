import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const stripeMocks = vi.hoisted(() => ({
  customersUpdate: vi.fn(),
  customersListTaxIds: vi.fn(),
  customersCreateTaxId: vi.fn(),
  subscriptionsCreate: vi.fn(),
  subscriptionsList: vi.fn(),
  subscriptionsRetrieve: vi.fn(),
  customerSessionsCreate: vi.fn(),
  sessionsCreate: vi.fn(),
}));

vi.mock("stripe", () => ({
  default: class Stripe {
    customers = {
      update: stripeMocks.customersUpdate,
      listTaxIds: stripeMocks.customersListTaxIds,
      createTaxId: stripeMocks.customersCreateTaxId,
    };
    subscriptions = {
      create: stripeMocks.subscriptionsCreate,
      list: stripeMocks.subscriptionsList,
      retrieve: stripeMocks.subscriptionsRetrieve,
    };
    customerSessions = { create: stripeMocks.customerSessionsCreate };
    checkout = { sessions: { create: stripeMocks.sessionsCreate } };

    constructor(_key: string) {}
  },
}));

import {
  resolveStripeTaxId,
  type StripeClient as StripeClientType,
} from "@/src/contexts/billing/clients/stripe.client";
import { PROFESSIONAL_ACCOUNT_TYPE } from "@/src/contexts/billing/types/billing.enums";

const address = {
  line1: "Calle Mayor 1",
  city: "Madrid",
  state: "Madrid",
  postal_code: "28013",
  country: "ES",
};

describe("resolveStripeTaxId", () => {
  it("usa eu_vat cuando el valor lleva prefijo de país UE", () => {
    expect(
      resolveStripeTaxId({
        tax_id: "es b-123.456 78",
        country: "ES",
        account_type: PROFESSIONAL_ACCOUNT_TYPE.COMPANY,
      }),
    ).toEqual({ type: "eu_vat", value: "ESB12345678" });
  });

  it("acepta prefijo EL (Grecia) para eu_vat", () => {
    expect(
      resolveStripeTaxId({
        tax_id: "EL123456789",
        country: "GR",
        account_type: PROFESSIONAL_ACCOUNT_TYPE.COMPANY,
      })?.type,
    ).toBe("eu_vat");
  });

  it("usa es_cif para empresa española sin prefijo", () => {
    expect(
      resolveStripeTaxId({
        tax_id: "B12345678",
        country: "ES",
        account_type: PROFESSIONAL_ACCOUNT_TYPE.COMPANY,
      }),
    ).toEqual({ type: "es_cif", value: "B12345678" });
  });

  it("no adjunta el DNI/NIE de un autónomo sin prefijo", () => {
    expect(
      resolveStripeTaxId({
        tax_id: "12345678Z",
        country: "ES",
        account_type: PROFESSIONAL_ACCOUNT_TYPE.SELF_EMPLOYED,
      }),
    ).toBeNull();
    expect(
      resolveStripeTaxId({
        tax_id: "X1234567L",
        country: "ES",
        account_type: PROFESSIONAL_ACCOUNT_TYPE.SELF_EMPLOYED,
      }),
    ).toBeNull();
  });

  it("no mapea empresas de otros países sin prefijo UE", () => {
    expect(
      resolveStripeTaxId({
        tax_id: "12345678",
        country: "MX",
        account_type: PROFESSIONAL_ACCOUNT_TYPE.COMPANY,
      }),
    ).toBeNull();
  });
});

describe("StripeClient PaymentSheet", () => {
  let StripeClient: typeof StripeClientType;
  let client: StripeClientType;

  // Unit tests run with isolate: false: another file may have already cached
  // stripe.client with ITS own `stripe` mock. Re-import so this file's mock wins.
  beforeAll(async () => {
    vi.resetModules();
    ({ StripeClient } = await import(
      "@/src/contexts/billing/clients/stripe.client"
    ));
  });

  beforeEach(() => {
    vi.clearAllMocks();
    client = new StripeClient();
    stripeMocks.customersUpdate.mockResolvedValue({ id: "cus_1" });
    stripeMocks.customersListTaxIds.mockResolvedValue({ data: [] });
    stripeMocks.customersCreateTaxId.mockResolvedValue({ id: "txi_1" });
  });

  describe("updateCustomerBillingProfile", () => {
    const params = {
      name: "Taller Juan SL",
      phone: "+34 612345678",
      address,
      tax_id: "B12345678",
      account_type: PROFESSIONAL_ACCOUNT_TYPE.COMPANY,
    };

    it("actualiza address y valida la ubicación fiscal de inmediato", async () => {
      await client.updateCustomerBillingProfile("cus_1", params);

      expect(stripeMocks.customersUpdate).toHaveBeenCalledWith("cus_1", {
        name: "Taller Juan SL",
        phone: "+34 612345678",
        address,
        tax: { validate_location: "immediately" },
      });
    });

    it("omite line2 y state vacíos", async () => {
      await client.updateCustomerBillingProfile("cus_1", {
        ...params,
        address: {
          line1: "Calle Mayor 1",
          line2: "",
          city: "Madrid",
          postal_code: "28013",
          country: "ES",
        },
      });

      const payload = stripeMocks.customersUpdate.mock.calls[0][1];
      expect(payload.address).toEqual({
        line1: "Calle Mayor 1",
        city: "Madrid",
        postal_code: "28013",
        country: "ES",
      });
    });

    it("propaga customer_tax_location_invalid (bloqueante)", async () => {
      stripeMocks.customersUpdate.mockRejectedValue({
        code: "customer_tax_location_invalid",
      });

      await expect(
        client.updateCustomerBillingProfile("cus_1", params),
      ).rejects.toMatchObject({ code: "customer_tax_location_invalid" });
      expect(stripeMocks.customersCreateTaxId).not.toHaveBeenCalled();
    });

    it("crea el tax id es_cif de una empresa española", async () => {
      await client.updateCustomerBillingProfile("cus_1", params);

      expect(stripeMocks.customersListTaxIds).toHaveBeenCalledWith("cus_1", {
        limit: 100,
      });
      expect(stripeMocks.customersCreateTaxId).toHaveBeenCalledWith("cus_1", {
        type: "es_cif",
        value: "B12345678",
      });
    });

    it("crea eu_vat cuando el valor lleva prefijo de país", async () => {
      await client.updateCustomerBillingProfile("cus_1", {
        ...params,
        tax_id: "ESB12345678",
      });

      expect(stripeMocks.customersCreateTaxId).toHaveBeenCalledWith("cus_1", {
        type: "eu_vat",
        value: "ESB12345678",
      });
    });

    it("no duplica un tax id ya asociado", async () => {
      stripeMocks.customersListTaxIds.mockResolvedValue({
        data: [{ type: "es_cif", value: "b12345678" }],
      });

      await client.updateCustomerBillingProfile("cus_1", params);

      expect(stripeMocks.customersCreateTaxId).not.toHaveBeenCalled();
    });

    it("tolera tax_id_invalid sin bloquear", async () => {
      stripeMocks.customersCreateTaxId.mockRejectedValue({
        code: "tax_id_invalid",
        message: "Invalid value",
      });

      await expect(
        client.updateCustomerBillingProfile("cus_1", params),
      ).resolves.toBeUndefined();
    });

    it("tolera fallos al listar tax ids sin bloquear", async () => {
      stripeMocks.customersListTaxIds.mockRejectedValue(new Error("network"));

      await expect(
        client.updateCustomerBillingProfile("cus_1", params),
      ).resolves.toBeUndefined();
    });

    it("no toca tax ids si el valor no se puede mapear (DNI de autónomo)", async () => {
      await client.updateCustomerBillingProfile("cus_1", {
        ...params,
        tax_id: "12345678Z",
        account_type: PROFESSIONAL_ACCOUNT_TYPE.SELF_EMPLOYED,
      });

      expect(stripeMocks.customersListTaxIds).not.toHaveBeenCalled();
      expect(stripeMocks.customersCreateTaxId).not.toHaveBeenCalled();
    });
  });

  describe("createSubscriptionForPaymentSheet", () => {
    it("crea la sub incomplete con metadata en la suscripción e idempotency key", async () => {
      stripeMocks.subscriptionsCreate.mockResolvedValue({ id: "sub_1" });

      const result = await client.createSubscriptionForPaymentSheet({
        customer_id: "cus_1",
        stripe_price_id: "price_1",
        profile_id: "profile-1",
        plan_id: "plan-1",
        plan_price_id: "plan-price-1",
        plan_version_id: "plan-version-1",
        professional_account_id: "pa-1",
        dealership_id: "dealer-1",
        idempotency_key: "sub-ps:key",
      });

      expect(result).toEqual({ id: "sub_1" });
      expect(stripeMocks.subscriptionsCreate).toHaveBeenCalledWith(
        {
          customer: "cus_1",
          items: [{ price: "price_1" }],
          payment_behavior: "default_incomplete",
          payment_settings: {
            save_default_payment_method: "on_subscription",
            payment_method_types: ["card"],
          },
          automatic_tax: { enabled: true },
          expand: ["latest_invoice.confirmation_secret", "pending_setup_intent"],
          metadata: {
            profile_id: "profile-1",
            plan_id: "plan-1",
            plan_price_id: "plan-price-1",
            plan_version_id: "plan-version-1",
            professional_account_id: "pa-1",
            checkout_source: "payment_sheet",
            dealership_id: "dealer-1",
          },
        },
        { idempotencyKey: "sub-ps:key" },
      );
    });

    it("omite dealership_id de la metadata si no hay concesionario", async () => {
      stripeMocks.subscriptionsCreate.mockResolvedValue({ id: "sub_1" });

      await client.createSubscriptionForPaymentSheet({
        customer_id: "cus_1",
        stripe_price_id: "price_1",
        profile_id: "profile-1",
        plan_id: "plan-1",
        plan_price_id: "plan-price-1",
        plan_version_id: "plan-version-1",
        professional_account_id: "pa-1",
        idempotency_key: "sub-ps:key",
      });

      const payload = stripeMocks.subscriptionsCreate.mock.calls[0][0];
      expect(payload.metadata).not.toHaveProperty("dealership_id");
    });
  });

  describe("suscripciones incomplete", () => {
    it("lista solo las incomplete del customer", async () => {
      stripeMocks.subscriptionsList.mockResolvedValue({
        data: [{ id: "sub_1" }],
      });

      await expect(client.listIncompleteSubscriptions("cus_1")).resolves.toEqual(
        [{ id: "sub_1" }],
      );
      expect(stripeMocks.subscriptionsList).toHaveBeenCalledWith({
        customer: "cus_1",
        status: "incomplete",
        limit: 20,
      });
    });

    it("recupera con expand de confirmation_secret y pending_setup_intent", async () => {
      stripeMocks.subscriptionsRetrieve.mockResolvedValue({ id: "sub_1" });

      await client.retrieveSubscriptionForPaymentSheet("sub_1");

      expect(stripeMocks.subscriptionsRetrieve).toHaveBeenCalledWith("sub_1", {
        expand: ["latest_invoice.confirmation_secret", "pending_setup_intent"],
      });
    });
  });

  describe("createCustomerSession", () => {
    it("habilita mobile_payment_element con save/redisplay/remove", async () => {
      stripeMocks.customerSessionsCreate.mockResolvedValue({
        client_secret: "cuss_secret",
      });

      await expect(
        client.createCustomerSession({ customer_id: "cus_1" }),
      ).resolves.toBe("cuss_secret");
      expect(stripeMocks.customerSessionsCreate).toHaveBeenCalledWith({
        customer: "cus_1",
        components: {
          mobile_payment_element: {
            enabled: true,
            features: {
              payment_method_save: "enabled",
              payment_method_redisplay: "enabled",
              payment_method_remove: "enabled",
            },
          },
        },
      });
    });
  });

  describe("createSubscriptionCheckout (flujo Checkout)", () => {
    it("incluye plan_price_id en subscription_data.metadata", async () => {
      stripeMocks.sessionsCreate.mockResolvedValue({
        url: "https://checkout.stripe.com/test",
      });

      await client.createSubscriptionCheckout({
        customer_id: "cus_1",
        stripe_price_id: "price_1",
        profile_id: "profile-1",
        plan_id: "plan-1",
        plan_price_id: "plan-price-1",
        plan_version_id: "plan-version-1",
      });

      const payload = stripeMocks.sessionsCreate.mock.calls[0][0];
      expect(payload.subscription_data.metadata).toMatchObject({
        profile_id: "profile-1",
        plan_id: "plan-1",
        plan_price_id: "plan-price-1",
        plan_version_id: "plan-version-1",
      });
      expect(payload.subscription_data.metadata).not.toHaveProperty(
        "checkout_source",
      );
    });
  });
});
