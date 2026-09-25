import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock(
  "@/src/contexts/vehicles/repositories/typeorm.vehicle-repository",
  () => ({
    TypeOrmVehicleRepository: class TypeOrmVehicleRepository {
      readonly mocked = true;
    },
  }),
);

import { StripeWebhookService } from "@/src/contexts/billing/services/stripe-webhook.service";
import { ONE_TIME_PRODUCT_KIND } from "@/src/contexts/billing/types/billing.enums";

const profile_id = "14f04126-a751-4cc0-851a-dfc5c9bf98b0";
const offer_id = "223ac813-eb7e-4c0e-9dc4-f8d89c365286";
const vehicle_id = "56aa4e9f-19cc-49aa-bb01-50a23c410f46";

describe("StripeWebhookService one-time claim", () => {
  const stripe_client = { constructWebhookEvent: vi.fn() };
  const webhook_event_repository = {
    claim: vi.fn(),
    markProcessed: vi.fn(),
    markFailed: vi.fn(),
  };
  const billing_profile_repository = { findById: vi.fn() };
  const purchase_repository = {
    claim: vi.fn(),
    create: vi.fn(),
    findByStripePaymentIntentId: vi.fn(),
    findByStripeCheckoutSessionId: vi.fn(),
    markEffectApplied: vi.fn(),
    markEffectAppliedById: vi.fn(),
  };
  const mail_service = { enqueueFeaturedPurchased: vi.fn() };
  const vehicle_repository = { findOne: vi.fn(), preload: vi.fn(), save: vi.fn() };
  const offer_repository = { findOne: vi.fn() };
  const vehicle_search_indexer = { syncVehicle: vi.fn() };
  const credits_service = { addCredit: vi.fn() };
  const me_session_cache_service = { invalidateByProfileId: vi.fn() };

  const createService = () =>
    new StripeWebhookService(
      stripe_client as never,
      webhook_event_repository as never,
      {} as never,
      billing_profile_repository as never,
      {} as never,
      {} as never,
      purchase_repository as never,
      {} as never,
      mail_service as never,
      vehicle_repository as never,
      {} as never,
      offer_repository as never,
      vehicle_search_indexer as never,
      {} as never,
      credits_service as never,
      me_session_cache_service as never,
    );

  const dispatchPaymentIntent = (metadata: Record<string, string>) => {
    stripe_client.constructWebhookEvent.mockReturnValue({
      id: "evt_pi",
      type: "payment_intent.succeeded",
      data: { object: { id: "pi_123", metadata } },
    });
    return createService().handle(Buffer.from("{}"), "sig");
  };

  const sheet_metadata = {
    profile_id,
    product_kind: ONE_TIME_PRODUCT_KIND.FEATURED_LISTING_OFFER,
    product_id: offer_id,
    checkout_source: "payment_sheet",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    webhook_event_repository.claim.mockResolvedValue({
      outcome: "claimed",
      attempts: 1,
    });
    offer_repository.findOne.mockResolvedValue({
      id: offer_id,
      duration_days: 7,
      boost_weight: 60,
    });
    vehicle_repository.findOne.mockResolvedValue({
      id: vehicle_id,
      license_plate: "1234ABC",
      publisher_type: "individual",
      profile: { id: profile_id },
    });
    vehicle_repository.preload.mockImplementation(async (data) => ({
      ...data,
      status: "active",
    }));
    billing_profile_repository.findById.mockResolvedValue({
      id: profile_id,
      email: "user@example.com",
    });
  });

  it("PI de PaymentSheet con vehicle_id reclama la compra y destaca el anuncio", async () => {
    purchase_repository.claim.mockResolvedValue(true);

    await dispatchPaymentIntent({ ...sheet_metadata, vehicle_id });

    expect(purchase_repository.claim).toHaveBeenCalledWith(
      expect.objectContaining({
        profile_id,
        product_kind: ONE_TIME_PRODUCT_KIND.FEATURED_LISTING_OFFER,
        product_id: offer_id,
        stripe_payment_intent_id: "pi_123",
      }),
    );
    expect(purchase_repository.create).not.toHaveBeenCalled();
    expect(vehicle_repository.preload).toHaveBeenCalledWith(
      expect.objectContaining({
        id: vehicle_id,
        is_featured: true,
        featured_boost_weight: 60,
      }),
    );
    expect(credits_service.addCredit).not.toHaveBeenCalled();
    expect(purchase_repository.markEffectApplied).toHaveBeenCalledWith("pi_123");
  });

  it("PI sin vehicle_id crea un crédito de destacado", async () => {
    purchase_repository.claim.mockResolvedValue(true);

    await dispatchPaymentIntent(sheet_metadata);

    expect(credits_service.addCredit).toHaveBeenCalledWith(
      expect.objectContaining({
        profile_id,
        offer_id,
        duration_days: 7,
        boost_weight: 60,
      }),
    );
    expect(vehicle_repository.preload).not.toHaveBeenCalled();
  });

  it("claim perdido con efecto aplicado no vuelve a aplicar", async () => {
    purchase_repository.claim.mockResolvedValue(false);
    purchase_repository.findByStripePaymentIntentId.mockResolvedValue({
      id: "p1",
      metadata: { effect_applied: true },
    });

    await dispatchPaymentIntent(sheet_metadata);

    expect(credits_service.addCredit).not.toHaveBeenCalled();
    expect(purchase_repository.markEffectApplied).not.toHaveBeenCalled();
  });

  it("claim perdido sin efecto aplicado reintenta el fulfillment", async () => {
    purchase_repository.claim.mockResolvedValue(false);
    purchase_repository.findByStripePaymentIntentId.mockResolvedValue({
      id: "p1",
      metadata: {},
    });

    await dispatchPaymentIntent(sheet_metadata);

    expect(credits_service.addCredit).toHaveBeenCalledTimes(1);
    expect(purchase_repository.markEffectApplied).toHaveBeenCalledWith("pi_123");
  });

  const dispatchCheckoutWithoutPaymentIntent = () => {
    stripe_client.constructWebhookEvent.mockReturnValue({
      id: "evt_cs",
      type: "checkout.session.completed",
      data: {
        object: {
          id: "cs_1",
          mode: "payment",
          payment_intent: null,
          metadata: sheet_metadata,
        },
      },
    });

    return createService().handle(Buffer.from("{}"), "sig");
  };

  it("checkout.session sin payment_intent usa create y aplica el efecto", async () => {
    purchase_repository.findByStripeCheckoutSessionId.mockResolvedValue(null);
    purchase_repository.create.mockResolvedValue("purchase_cs_1");

    await dispatchCheckoutWithoutPaymentIntent();

    expect(purchase_repository.claim).not.toHaveBeenCalled();
    expect(purchase_repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        stripe_payment_intent_id: null,
        metadata: expect.objectContaining({ stripe_checkout_session_id: "cs_1" }),
      }),
    );
    expect(credits_service.addCredit).toHaveBeenCalledWith(
      expect.objectContaining({ stripe_checkout_session_id: "cs_1" }),
    );
    expect(purchase_repository.markEffectAppliedById).toHaveBeenCalledWith(
      "purchase_cs_1",
    );
  });

  it("checkout.session sin payment_intent reintentado con efecto aplicado no duplica", async () => {
    purchase_repository.findByStripeCheckoutSessionId.mockResolvedValue({
      id: "purchase_cs_1",
      metadata: { effect_applied: true },
    });

    await dispatchCheckoutWithoutPaymentIntent();

    expect(purchase_repository.create).not.toHaveBeenCalled();
    expect(credits_service.addCredit).not.toHaveBeenCalled();
    expect(purchase_repository.markEffectAppliedById).not.toHaveBeenCalled();
  });

  it("checkout.session sin payment_intent reintentado sin efecto reutiliza la compra", async () => {
    purchase_repository.findByStripeCheckoutSessionId.mockResolvedValue({
      id: "purchase_cs_1",
      metadata: {},
    });

    await dispatchCheckoutWithoutPaymentIntent();

    expect(purchase_repository.create).not.toHaveBeenCalled();
    expect(credits_service.addCredit).toHaveBeenCalledTimes(1);
    expect(purchase_repository.markEffectAppliedById).toHaveBeenCalledWith(
      "purchase_cs_1",
    );
  });

  it("PI sin metadata (creado por Checkout) se ignora", async () => {
    await dispatchPaymentIntent({});

    expect(purchase_repository.claim).not.toHaveBeenCalled();
    expect(purchase_repository.create).not.toHaveBeenCalled();
  });
});
