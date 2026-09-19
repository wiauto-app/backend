import "reflect-metadata";

import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { CreateSubscriptionCheckoutHttpDto } from "@/src/contexts/billing/api/user/create-subscription-checkout/create-subscription-checkout.http-dto";
import { CreateSubscriptionPaymentSheetHttpDto } from "@/src/contexts/billing/api/user/create-subscription-payment-sheet/create-subscription-payment-sheet.http-dto";
import { BillingCheckoutService } from "@/src/contexts/billing/services/billing-plans.service";
import {
  BILLING_TYPE,
  PROFESSIONAL_ACCOUNT_TYPE,
} from "@/src/contexts/billing/types/billing.enums";

const profile_id = "14f04126-a751-4cc0-851a-dfc5c9bf98b0";
const plan_id = "223ac813-eb7e-4c0e-9dc4-f8d89c365286";
const plan_price_id = "56aa4e9f-19cc-49aa-bb01-50a23c410f46";
const plan_version_id = "797f4ef7-08d3-4408-8d22-f8bd985cc3ac";
const professional_account_id = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";
const dealership_id = "0f0f0f0f-1111-2222-3333-444444444444";
const customer_id = "cus_test_123";
const stripe_price_id = "price_test_123";

const validBody = (overrides: Record<string, unknown> = {}) =>
  plainToInstance(CreateSubscriptionPaymentSheetHttpDto, {
    plan_price_id,
    account_type: PROFESSIONAL_ACCOUNT_TYPE.COMPANY,
    legal_name: "Taller Juan SL",
    tax_id: "B12345678",
    commercial_name: "Taller Juan",
    email: "juan@ejemplo.com",
    phone_code: "+34",
    phone: "612345678",
    accepted_terms: true,
    billing_address: {
      line1: "Calle Mayor 1",
      city: "Madrid",
      state: "Madrid",
      postal_code: "28013",
      country: "ES",
    },
    ...overrides,
  });

describe("CreateSubscriptionPaymentSheetHttpDto", () => {
  it("acepta el contrato completo", async () => {
    expect(await validate(validBody())).toHaveLength(0);
  });

  it("line2 y state son opcionales", async () => {
    const dto = validBody({
      billing_address: {
        line1: "Calle Mayor 1",
        city: "Madrid",
        postal_code: "28013",
        country: "ES",
      },
    });

    expect(await validate(dto)).toHaveLength(0);
  });

  it("normaliza country a mayúsculas", async () => {
    const dto = validBody({
      billing_address: {
        line1: "Calle Mayor 1",
        city: "Madrid",
        postal_code: "28013",
        country: " es ",
      },
    });

    expect(await validate(dto)).toHaveLength(0);
    expect(dto.billing_address.country).toBe("ES");
  });

  it("rechaza country que no es ISO-2", async () => {
    const dto = validBody({
      billing_address: {
        line1: "Calle Mayor 1",
        city: "Madrid",
        postal_code: "28013",
        country: "ESP",
      },
    });

    const errors = await validate(dto);
    const nested = errors.find((error) => error.property === "billing_address");
    expect(
      nested?.children?.some((child) => child.property === "country"),
    ).toBe(true);
  });

  it("rechaza billing_address ausente", async () => {
    const dto = validBody({ billing_address: undefined });

    const errors = await validate(dto);
    expect(errors.some((error) => error.property === "billing_address")).toBe(
      true,
    );
  });

  it("valida los campos obligatorios de la dirección", async () => {
    const dto = validBody({ billing_address: { country: "ES" } });

    const errors = await validate(dto);
    const nested = errors.find((error) => error.property === "billing_address");
    const properties = nested?.children?.map((child) => child.property) ?? [];
    expect(properties).toEqual(
      expect.arrayContaining(["line1", "city", "postal_code"]),
    );
  });

  it("hereda los validadores fiscales (accepted_terms, email, account_type)", async () => {
    const dto = validBody({
      accepted_terms: false,
      email: "no-es-un-email",
      account_type: "freelancer",
    });

    const properties = (await validate(dto)).map((error) => error.property);
    expect(properties).toEqual(
      expect.arrayContaining(["accepted_terms", "email", "account_type"]),
    );
  });

  it("rechaza plan_price_id que no es UUID", async () => {
    const dto = validBody({ plan_price_id: "no-uuid" });

    const errors = await validate(dto);
    expect(errors.some((error) => error.property === "plan_price_id")).toBe(
      true,
    );
  });

  it("el DTO de checkout hosted sigue validando igual tras extraer la base", async () => {
    const dto = plainToInstance(CreateSubscriptionCheckoutHttpDto, {
      plan_price_id,
    });

    const properties = (await validate(dto)).map((error) => error.property);
    expect(properties).toEqual(
      expect.arrayContaining([
        "account_type",
        "legal_name",
        "tax_id",
        "email",
        "phone_code",
        "phone",
        "accepted_terms",
      ]),
    );
  });
});

describe("BillingCheckoutService.createSubscriptionPaymentSheet", () => {
  const now = new Date("2026-09-19T10:00:00.000Z");
  const now_seconds = Math.floor(now.getTime() / 1000);

  const plan_repository = { findPriceById: vi.fn() };
  const billing_profile_repository = {
    findById: vi.fn(),
    updateStripeCustomerId: vi.fn(),
  };
  const stripe_client = {
    createCustomer: vi.fn(),
    updateCustomerPreferredLocales: vi.fn(),
    updateCustomerBillingProfile: vi.fn(),
    listIncompleteSubscriptions: vi.fn(),
    retrieveSubscriptionForPaymentSheet: vi.fn(),
    cancelSubscriptionImmediately: vi.fn(),
    createSubscriptionForPaymentSheet: vi.fn(),
    createCustomerSession: vi.fn(),
  };
  const plan_versions_service = { findPublishedByPlanId: vi.fn() };
  const dealership_members_repository = { findOne: vi.fn() };
  const professional_account_repository = {
    findOne: vi.fn(),
    create: vi.fn(),
    preload: vi.fn(),
    save: vi.fn(),
  };
  const subscription_repository = { findCancellableByProfileId: vi.fn() };

  const createService = () =>
    new BillingCheckoutService(
      plan_repository as never,
      billing_profile_repository as never,
      stripe_client as never,
      plan_versions_service as never,
      {} as never,
      {} as never,
      dealership_members_repository as never,
      professional_account_repository as never,
      subscription_repository as never,
    );

  const buildSubscription = (overrides: Record<string, unknown> = {}) => ({
    id: "sub_new",
    created: now_seconds,
    status: "incomplete",
    metadata: { checkout_source: "payment_sheet" },
    items: { data: [{ price: { id: stripe_price_id } }] },
    latest_invoice: {
      status: "open",
      confirmation_secret: { client_secret: "pi_123_secret_abc" },
    },
    pending_setup_intent: null,
    ...overrides,
  });

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(now);

    plan_repository.findPriceById.mockResolvedValue({
      id: plan_price_id,
      plan_id,
      stripe_price_id,
      plan: { id: plan_id, billing_type: BILLING_TYPE.RECURRING },
    });
    plan_versions_service.findPublishedByPlanId.mockResolvedValue({
      id: plan_version_id,
    });
    subscription_repository.findCancellableByProfileId.mockResolvedValue([]);
    dealership_members_repository.findOne.mockResolvedValue(null);
    billing_profile_repository.findById.mockResolvedValue({
      id: profile_id,
      email: "user@example.com",
      name: "Usuario",
      stripe_customer_id: customer_id,
    });
    professional_account_repository.findOne.mockResolvedValue(null);
    professional_account_repository.create.mockImplementation((data) => data);
    professional_account_repository.save.mockResolvedValue({
      id: professional_account_id,
      profile_id,
      stripe_customer_id: null,
    });
    professional_account_repository.preload.mockImplementation((data) => data);
    stripe_client.updateCustomerPreferredLocales.mockResolvedValue(undefined);
    stripe_client.updateCustomerBillingProfile.mockResolvedValue(undefined);
    stripe_client.listIncompleteSubscriptions.mockResolvedValue([]);
    stripe_client.cancelSubscriptionImmediately.mockResolvedValue(undefined);
    stripe_client.createSubscriptionForPaymentSheet.mockResolvedValue(
      buildSubscription(),
    );
    stripe_client.createCustomerSession.mockResolvedValue("cuss_secret_123");
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("responde 409 en español si ya hay una suscripción viva y no toca nada más", async () => {
    subscription_repository.findCancellableByProfileId.mockResolvedValue([
      { id: "local-sub", status: "active" },
    ]);

    await expect(
      createService().createSubscriptionPaymentSheet(profile_id, validBody()),
    ).rejects.toMatchObject({
      status: 409,
      message:
        "Ya tienes una suscripción activa; gestiona el cambio de plan desde tu suscripción",
    });

    expect(subscription_repository.findCancellableByProfileId).toHaveBeenCalledWith(
      profile_id,
    );
    expect(professional_account_repository.save).not.toHaveBeenCalled();
    expect(stripe_client.updateCustomerBillingProfile).not.toHaveBeenCalled();
    expect(
      stripe_client.createSubscriptionForPaymentSheet,
    ).not.toHaveBeenCalled();
  });

  it("rechaza si el precio no es recurrente antes de consultar suscripciones", async () => {
    plan_repository.findPriceById.mockResolvedValue({
      id: plan_price_id,
      plan_id,
      stripe_price_id,
      plan: { id: plan_id, billing_type: BILLING_TYPE.ONE_TIME },
    });

    await expect(
      createService().createSubscriptionPaymentSheet(profile_id, validBody()),
    ).rejects.toMatchObject({ status: 400 });
    expect(subscription_repository.findCancellableByProfileId).not.toHaveBeenCalled();
  });

  it("intent_type payment: sincroniza customer, crea la sub con metadata y devuelve secrets", async () => {
    dealership_members_repository.findOne.mockResolvedValue({ dealership_id });

    const result = await createService().createSubscriptionPaymentSheet(
      profile_id,
      validBody(),
    );

    expect(result).toEqual({
      intent_type: "payment",
      client_secret: "pi_123_secret_abc",
      customer_session_client_secret: "cuss_secret_123",
      customer_id,
      subscription_id: "sub_new",
    });

    expect(professional_account_repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        profile_id,
        type: PROFESSIONAL_ACCOUNT_TYPE.COMPANY,
        legal_name: "Taller Juan SL",
        tax_id: "B12345678",
      }),
    );
    expect(stripe_client.updateCustomerBillingProfile).toHaveBeenCalledWith(
      customer_id,
      {
        name: "Taller Juan SL",
        phone: "+34 612345678",
        address: {
          line1: "Calle Mayor 1",
          line2: undefined,
          city: "Madrid",
          state: "Madrid",
          postal_code: "28013",
          country: "ES",
        },
        tax_id: "B12345678",
        account_type: PROFESSIONAL_ACCOUNT_TYPE.COMPANY,
      },
    );
    expect(professional_account_repository.preload).toHaveBeenCalledWith({
      id: professional_account_id,
      stripe_customer_id: customer_id,
    });
    expect(stripe_client.createSubscriptionForPaymentSheet).toHaveBeenCalledWith({
      customer_id,
      stripe_price_id,
      profile_id,
      plan_id,
      plan_price_id,
      plan_version_id,
      professional_account_id,
      dealership_id,
      idempotency_key: expect.stringContaining(
        `sub-ps:${profile_id}:${plan_price_id}:`,
      ),
    });
    expect(stripe_client.createCustomerSession).toHaveBeenCalledWith({
      customer_id,
    });
  });

  it("crea el customer de Stripe si el perfil no tiene uno", async () => {
    billing_profile_repository.findById.mockResolvedValue({
      id: profile_id,
      email: "user@example.com",
      name: "Usuario",
      stripe_customer_id: null,
    });
    stripe_client.createCustomer.mockResolvedValue("cus_new");

    const result = await createService().createSubscriptionPaymentSheet(
      profile_id,
      validBody(),
    );

    expect(billing_profile_repository.updateStripeCustomerId).toHaveBeenCalledWith(
      profile_id,
      "cus_new",
    );
    expect(result.customer_id).toBe("cus_new");
    expect(stripe_client.updateCustomerBillingProfile).toHaveBeenCalledWith(
      "cus_new",
      expect.any(Object),
    );
  });

  it("intent_type setup cuando el total es 0 (pending_setup_intent)", async () => {
    stripe_client.createSubscriptionForPaymentSheet.mockResolvedValue(
      buildSubscription({
        latest_invoice: { status: "paid", confirmation_secret: null },
        pending_setup_intent: { status: "requires_payment_method", client_secret: "seti_secret" },
      }),
    );

    const result = await createService().createSubscriptionPaymentSheet(
      profile_id,
      validBody(),
    );

    expect(result.intent_type).toBe("setup");
    expect(result.client_secret).toBe("seti_secret");
  });

  it("intent_type none cuando no hay ningún secret", async () => {
    stripe_client.createSubscriptionForPaymentSheet.mockResolvedValue(
      buildSubscription({
        status: "trialing",
        latest_invoice: "in_not_expanded",
        pending_setup_intent: null,
      }),
    );

    const result = await createService().createSubscriptionPaymentSheet(
      profile_id,
      validBody(),
    );

    expect(result.intent_type).toBe("none");
    expect(result.client_secret).toBeNull();
    expect(result.subscription_id).toBe("sub_new");
  });

  it("reutiliza la sub incomplete del mismo precio (<23h) sin crear ni cancelar", async () => {
    const existing = buildSubscription({ id: "sub_existing" });
    stripe_client.listIncompleteSubscriptions.mockResolvedValue([existing]);
    stripe_client.retrieveSubscriptionForPaymentSheet.mockResolvedValue(
      buildSubscription({
        id: "sub_existing",
        latest_invoice: {
          status: "open",
          confirmation_secret: { client_secret: "pi_existing_secret" },
        },
      }),
    );

    const result = await createService().createSubscriptionPaymentSheet(
      profile_id,
      validBody(),
    );

    expect(stripe_client.listIncompleteSubscriptions).toHaveBeenCalledWith(
      customer_id,
    );
    expect(
      stripe_client.retrieveSubscriptionForPaymentSheet,
    ).toHaveBeenCalledWith("sub_existing");
    expect(
      stripe_client.createSubscriptionForPaymentSheet,
    ).not.toHaveBeenCalled();
    expect(stripe_client.cancelSubscriptionImmediately).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      intent_type: "payment",
      client_secret: "pi_existing_secret",
      subscription_id: "sub_existing",
      customer_session_client_secret: "cuss_secret_123",
    });
  });

  it("cancela y recrea si la incomplete es de otro precio", async () => {
    stripe_client.listIncompleteSubscriptions.mockResolvedValue([
      buildSubscription({
        id: "sub_other_price",
        items: { data: [{ price: { id: "price_other" } }] },
      }),
    ]);

    await createService().createSubscriptionPaymentSheet(profile_id, validBody());

    expect(
      stripe_client.retrieveSubscriptionForPaymentSheet,
    ).not.toHaveBeenCalled();
    expect(stripe_client.cancelSubscriptionImmediately).toHaveBeenCalledWith(
      "sub_other_price",
    );
    expect(stripe_client.createSubscriptionForPaymentSheet).toHaveBeenCalledWith(
      expect.objectContaining({
        idempotency_key: expect.stringContaining(":after:sub_other_price"),
      }),
    );
  });

  it("cancela y recrea si la incomplete tiene 23h o más", async () => {
    stripe_client.listIncompleteSubscriptions.mockResolvedValue([
      buildSubscription({
        id: "sub_stale",
        created: now_seconds - 23 * 60 * 60,
      }),
    ]);

    await createService().createSubscriptionPaymentSheet(profile_id, validBody());

    expect(stripe_client.cancelSubscriptionImmediately).toHaveBeenCalledWith(
      "sub_stale",
    );
    expect(
      stripe_client.retrieveSubscriptionForPaymentSheet,
    ).not.toHaveBeenCalled();
    expect(stripe_client.createSubscriptionForPaymentSheet).toHaveBeenCalledTimes(1);
  });

  it("cancela y recrea si la invoice de la incomplete ya no está abierta", async () => {
    stripe_client.listIncompleteSubscriptions.mockResolvedValue([
      buildSubscription({ id: "sub_void" }),
    ]);
    stripe_client.retrieveSubscriptionForPaymentSheet.mockResolvedValue(
      buildSubscription({
        id: "sub_void",
        latest_invoice: { status: "void", confirmation_secret: null },
      }),
    );

    await createService().createSubscriptionPaymentSheet(profile_id, validBody());

    expect(stripe_client.cancelSubscriptionImmediately).toHaveBeenCalledWith(
      "sub_void",
    );
    expect(stripe_client.createSubscriptionForPaymentSheet).toHaveBeenCalledTimes(1);
  });

  it("cancela las incomplete sobrantes y conserva solo la reutilizable", async () => {
    stripe_client.listIncompleteSubscriptions.mockResolvedValue([
      buildSubscription({ id: "sub_keep" }),
      buildSubscription({ id: "sub_duplicate" }),
    ]);
    stripe_client.retrieveSubscriptionForPaymentSheet.mockResolvedValue(
      buildSubscription({ id: "sub_keep" }),
    );

    const result = await createService().createSubscriptionPaymentSheet(
      profile_id,
      validBody(),
    );

    expect(result.subscription_id).toBe("sub_keep");
    expect(stripe_client.cancelSubscriptionImmediately).toHaveBeenCalledTimes(1);
    expect(stripe_client.cancelSubscriptionImmediately).toHaveBeenCalledWith(
      "sub_duplicate",
    );
  });

  it("ignora incomplete que no vienen del flujo PaymentSheet", async () => {
    stripe_client.listIncompleteSubscriptions.mockResolvedValue([
      buildSubscription({ id: "sub_checkout", metadata: {} }),
    ]);

    await createService().createSubscriptionPaymentSheet(profile_id, validBody());

    expect(stripe_client.cancelSubscriptionImmediately).not.toHaveBeenCalled();
    expect(stripe_client.createSubscriptionForPaymentSheet).toHaveBeenCalledTimes(1);
  });

  it("no falla si la incomplete a cancelar ya no existe en Stripe", async () => {
    stripe_client.listIncompleteSubscriptions.mockResolvedValue([
      buildSubscription({
        id: "sub_gone",
        items: { data: [{ price: { id: "price_other" } }] },
      }),
    ]);
    stripe_client.cancelSubscriptionImmediately.mockRejectedValue({
      code: "resource_missing",
    });

    await expect(
      createService().createSubscriptionPaymentSheet(profile_id, validBody()),
    ).resolves.toMatchObject({ subscription_id: "sub_new" });
  });

  it("idempotency key estable dentro de la ventana y distinta fuera de ella", async () => {
    const service = createService();

    await service.createSubscriptionPaymentSheet(profile_id, validBody());
    vi.setSystemTime(new Date(now.getTime() + 5_000));
    await service.createSubscriptionPaymentSheet(profile_id, validBody());
    vi.setSystemTime(new Date(now.getTime() + 3 * 60_000));
    await service.createSubscriptionPaymentSheet(profile_id, validBody());

    const keys = stripe_client.createSubscriptionForPaymentSheet.mock.calls.map(
      ([params]) => params.idempotency_key as string,
    );
    expect(keys[0]).toBe(keys[1]);
    expect(keys[2]).not.toBe(keys[0]);
  });

  it("mapea customer_tax_location_invalid a 400 en español y no crea la sub", async () => {
    stripe_client.updateCustomerBillingProfile.mockRejectedValue({
      code: "customer_tax_location_invalid",
    });

    await expect(
      createService().createSubscriptionPaymentSheet(profile_id, validBody()),
    ).rejects.toMatchObject({
      status: 400,
      message: expect.stringContaining(
        "No pudimos validar tu dirección de facturación",
      ),
    });
    expect(
      stripe_client.createSubscriptionForPaymentSheet,
    ).not.toHaveBeenCalled();
  });

  it("mapea customer_tax_location_invalid al crear la suscripción", async () => {
    stripe_client.createSubscriptionForPaymentSheet.mockRejectedValue({
      code: "customer_tax_location_invalid",
    });

    await expect(
      createService().createSubscriptionPaymentSheet(profile_id, validBody()),
    ).rejects.toMatchObject({ status: 400 });
  });

  it("mapea idempotency_key_in_use (doble tap concurrente) a 409", async () => {
    stripe_client.createSubscriptionForPaymentSheet.mockRejectedValue({
      code: "idempotency_key_in_use",
    });

    await expect(
      createService().createSubscriptionPaymentSheet(profile_id, validBody()),
    ).rejects.toMatchObject({ status: 409 });
  });

  it("propaga errores de Stripe desconocidos sin transformarlos", async () => {
    const boom = Object.assign(new Error("boom"), { code: "api_error" });
    stripe_client.createSubscriptionForPaymentSheet.mockRejectedValue(boom);

    await expect(
      createService().createSubscriptionPaymentSheet(profile_id, validBody()),
    ).rejects.toBe(boom);
  });
});
