import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { CreateSubscriptionCheckoutHttpDto } from "@/src/contexts/billing/api/user/create-subscription-checkout/create-subscription-checkout.http-dto";
import { BillingCheckoutService } from "@/src/contexts/billing/services/billing-plans.service";
import { BILLING_TYPE, PROFESSIONAL_ACCOUNT_TYPE } from "@/src/contexts/billing/types/billing.enums";
import { envs } from "@/src/common/envs";

const profile_id = "14f04126-a751-4cc0-851a-dfc5c9bf98b0";
const plan_id = "223ac813-eb7e-4c0e-9dc4-f8d89c365286";
const plan_price_id = "56aa4e9f-19cc-49aa-bb01-50a23c410f46";
const plan_version_id = "797f4ef7-08d3-4408-8d22-f8bd985cc3ac";
const professional_account_id = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";
const customer_id = "cus_test_123";

const validFiscalBody = () =>
  plainToInstance(CreateSubscriptionCheckoutHttpDto, {
    plan_price_id,
    account_type: PROFESSIONAL_ACCOUNT_TYPE.SELF_EMPLOYED,
    legal_name: "Juan Pérez",
    tax_id: "12345678Z",
    commercial_name: "Taller Juan",
    email: "juan@ejemplo.com",
    phone_code: "+34",
    phone: "612345678",
    accepted_terms: true,
  });

describe("CreateSubscriptionCheckoutHttpDto", () => {
  it("acepta el contrato fiscal completo", async () => {
    expect(await validate(validFiscalBody())).toHaveLength(0);
  });

  it("rechaza accepted_terms distinto de true", async () => {
    const dto = validFiscalBody();
    dto.accepted_terms = false;

    const errors = await validate(dto);
    expect(errors.some((error) => error.property === "accepted_terms")).toBe(
      true,
    );
  });

  it("rechaza account_type inválido", async () => {
    const dto = validFiscalBody();
    (dto as { account_type: string }).account_type = "freelancer";

    const errors = await validate(dto);
    expect(errors.some((error) => error.property === "account_type")).toBe(
      true,
    );
  });

  it("rechaza body sin campos fiscales", async () => {
    const dto = plainToInstance(CreateSubscriptionCheckoutHttpDto, {
      plan_price_id,
    });

    const errors = await validate(dto);
    const properties = errors.map((error) => error.property);

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

  it("rechaza email inválido", async () => {
    const dto = validFiscalBody();
    dto.email = "no-es-un-email";

    const errors = await validate(dto);
    expect(errors.some((error) => error.property === "email")).toBe(true);
  });

  it("rechaza phone vacío", async () => {
    const dto = validFiscalBody();
    dto.phone = "";

    const errors = await validate(dto);
    expect(errors.some((error) => error.property === "phone")).toBe(true);
  });
});

describe("BillingCheckoutService.createSubscriptionCheckout", () => {
  const plan_repository = {
    findPriceById: vi.fn(),
  };
  const billing_profile_repository = {
    findById: vi.fn(),
    updateStripeCustomerId: vi.fn(),
  };
  const stripe_client = {
    createCustomer: vi.fn(),
    createSubscriptionCheckout: vi.fn(),
    updateCustomerPreferredLocales: vi.fn(),
  };
  const plan_versions_service = {
    findPublishedByPlanId: vi.fn(),
  };
  const dealership_members_repository = {
    findOne: vi.fn(),
  };
  const professional_account_repository = {
    findOne: vi.fn(),
    create: vi.fn(),
    preload: vi.fn(),
    save: vi.fn(),
  };

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
    );

  beforeEach(() => {
    vi.clearAllMocks();

    plan_repository.findPriceById.mockResolvedValue({
      id: plan_price_id,
      plan_id,
      stripe_price_id: "price_test_123",
      plan: {
        toPrimitives: () => ({
          id: plan_id,
          billing_type: BILLING_TYPE.RECURRING,
        }),
      },
    });
    plan_versions_service.findPublishedByPlanId.mockResolvedValue({
      id: plan_version_id,
    });
    dealership_members_repository.findOne.mockResolvedValue(null);
    billing_profile_repository.findById.mockResolvedValue({
      id: profile_id,
      email: "user@example.com",
      name: "Usuario",
      stripe_customer_id: customer_id,
    });
    stripe_client.createSubscriptionCheckout.mockResolvedValue(
      "https://checkout.stripe.com/test",
    );
    stripe_client.updateCustomerPreferredLocales.mockResolvedValue(undefined);
  });

  it("crea professional_account y pasa tax_id_collection + URLs de billing-plan a Stripe", async () => {
    professional_account_repository.findOne.mockResolvedValue(null);
    professional_account_repository.create.mockImplementation((data) => data);
    professional_account_repository.save.mockResolvedValue({
      id: professional_account_id,
      profile_id,
    });

    const result = await createService().createSubscriptionCheckout(
      profile_id,
      validFiscalBody(),
    );

    expect(professional_account_repository.create).toHaveBeenCalledWith({
      profile_id,
      type: PROFESSIONAL_ACCOUNT_TYPE.SELF_EMPLOYED,
      legal_name: "Juan Pérez",
      commercial_name: "Taller Juan",
      tax_id: "12345678Z",
      email: "juan@ejemplo.com",
      phone_code: "+34",
      phone: "612345678",
      accepted_terms_at: expect.any(Date),
    });
    expect(stripe_client.createSubscriptionCheckout).toHaveBeenCalledWith({
      customer_id,
      stripe_price_id: "price_test_123",
      profile_id,
      plan_id,
      plan_price_id,
      plan_version_id,
      dealership_id: undefined,
      professional_account_id,
      billing_address_collection: "required",
      tax_id_collection: { enabled: true },
      success_url: `${envs.FRONTEND_URL}/billing-plan/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${envs.FRONTEND_URL}/billing-plan?plan_price_id=${plan_price_id}`,
    });
    expect(stripe_client.updateCustomerPreferredLocales).toHaveBeenCalledWith(
      customer_id,
    );
    expect(result).toEqual({
      checkout_url: "https://checkout.stripe.com/test",
    });
  });

  it("actualiza professional_account existente con preload + save", async () => {
    professional_account_repository.findOne.mockResolvedValue({
      id: professional_account_id,
      profile_id,
    });
    professional_account_repository.preload.mockResolvedValue({
      id: professional_account_id,
      profile_id,
      type: PROFESSIONAL_ACCOUNT_TYPE.COMPANY,
      legal_name: "Empresa SL",
      commercial_name: null,
      tax_id: "B12345678",
      accepted_terms_at: expect.any(Date),
    });
    professional_account_repository.save.mockResolvedValue({
      id: professional_account_id,
      profile_id,
    });

    const dto = validFiscalBody();
    dto.account_type = PROFESSIONAL_ACCOUNT_TYPE.COMPANY;
    dto.legal_name = "Empresa SL";
    dto.tax_id = "B12345678";
    dto.commercial_name = undefined;

    await createService().createSubscriptionCheckout(profile_id, dto);

    expect(professional_account_repository.preload).toHaveBeenCalledWith({
      id: professional_account_id,
      type: PROFESSIONAL_ACCOUNT_TYPE.COMPANY,
      legal_name: "Empresa SL",
      commercial_name: null,
      tax_id: "B12345678",
      email: "juan@ejemplo.com",
      phone_code: "+34",
      phone: "612345678",
      accepted_terms_at: expect.any(Date),
    });
    expect(professional_account_repository.save).toHaveBeenCalled();
    expect(professional_account_repository.create).not.toHaveBeenCalled();
    expect(stripe_client.createSubscriptionCheckout).toHaveBeenCalledWith(
      expect.objectContaining({
        professional_account_id,
        tax_id_collection: { enabled: true },
        billing_address_collection: "required",
      }),
    );
    expect(stripe_client.updateCustomerPreferredLocales).toHaveBeenCalledWith(
      customer_id,
    );
  });

  it("crea customer Stripe nuevo sin update de preferred_locales", async () => {
    billing_profile_repository.findById.mockResolvedValue({
      id: profile_id,
      email: "user@example.com",
      name: "Usuario",
      stripe_customer_id: null,
    });
    stripe_client.createCustomer.mockResolvedValue("cus_new");
    professional_account_repository.findOne.mockResolvedValue(null);
    professional_account_repository.create.mockImplementation((data) => data);
    professional_account_repository.save.mockResolvedValue({
      id: professional_account_id,
      profile_id,
    });

    await createService().createSubscriptionCheckout(
      profile_id,
      validFiscalBody(),
    );

    expect(stripe_client.createCustomer).toHaveBeenCalledWith({
      email: "user@example.com",
      name: "Usuario",
      profile_id,
    });
    expect(stripe_client.updateCustomerPreferredLocales).not.toHaveBeenCalled();
    expect(stripe_client.createSubscriptionCheckout).toHaveBeenCalledWith(
      expect.objectContaining({ customer_id: "cus_new" }),
    );
  });
});
