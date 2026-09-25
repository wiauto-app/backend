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

const profile_id = "14f04126-a751-4cc0-851a-dfc5c9bf98b0";
const plan_id = "223ac813-eb7e-4c0e-9dc4-f8d89c365286";
const customer_id = "cus_test_123";

describe("StripeWebhookService PaymentSheet", () => {
  const stripe_client = {
    constructWebhookEvent: vi.fn(),
    createPortalSession: vi.fn(),
    updateSubscriptionMetadata: vi.fn(),
  };
  const webhook_event_repository = {
    claim: vi.fn(),
    markProcessed: vi.fn(),
    markFailed: vi.fn(),
  };
  const subscription_repository = {
    findByStripeSubscriptionId: vi.fn(),
    findActiveByProfileId: vi.fn(),
  };
  const billing_profile_repository = {
    findById: vi.fn(),
    findByStripeCustomerId: vi.fn(),
  };
  const plan_repository = { findOne: vi.fn() };
  const invoice_repository = { upsert: vi.fn() };
  const provisioning_service = {
    resolveProfileIdFromSubscription: vi.fn(),
    syncSubscriptionRecord: vi.fn(),
    applyPlanEntitlements: vi.fn(),
    linkDealershipPlan: vi.fn(),
    revokePlanEntitlements: vi.fn(),
    isActiveSubscriptionStatus: vi.fn(),
  };
  const mail_service = {
    enqueueSubscriptionWelcome: vi.fn(),
    enqueueSubscriptionPaymentFailed: vi.fn(),
    enqueueSubscriptionEnded: vi.fn(),
    enqueueSubscriptionPlanChanged: vi.fn(),
  };
  const me_session_cache_service = { invalidateByProfileId: vi.fn() };

  const createService = () =>
    new StripeWebhookService(
      stripe_client as never,
      webhook_event_repository as never,
      subscription_repository as never,
      billing_profile_repository as never,
      plan_repository as never,
      invoice_repository as never,
      {} as never,
      provisioning_service as never,
      mail_service as never,
      {} as never, // vehicle_repository
      {} as never, // pack_repository_entity
      {} as never, // offer_repository_entity
      {} as never, // vehicle_search_indexer
      {} as never, // assistant_quota_service
      {} as never, // featured_listing_credits_service
      me_session_cache_service as never,
    );

  const dispatch = (type: string, object: unknown) => {
    stripe_client.constructWebhookEvent.mockReturnValue({
      id: `evt_${type}`,
      type,
      data: { object },
    });
    return createService().handle(Buffer.from("{}"), "sig");
  };

  const buildSubscription = (overrides: Record<string, unknown> = {}) => ({
    id: "sub_1",
    status: "active",
    customer: customer_id,
    cancel_at_period_end: false,
    metadata: {
      profile_id,
      plan_id,
      plan_version_id: "version-1",
      checkout_source: "payment_sheet",
    },
    items: { data: [{}] },
    ...overrides,
  });

  beforeEach(() => {
    vi.clearAllMocks();

    webhook_event_repository.claim.mockResolvedValue({
      outcome: "claimed",
      attempts: 1,
    });
    provisioning_service.resolveProfileIdFromSubscription.mockResolvedValue(
      profile_id,
    );
    provisioning_service.isActiveSubscriptionStatus.mockImplementation(
      (status: string) => status === "active" || status === "trialing",
    );
    billing_profile_repository.findById.mockResolvedValue({
      id: profile_id,
      email: "user@example.com",
      stripe_customer_id: customer_id,
    });
    billing_profile_repository.findByStripeCustomerId.mockResolvedValue({
      id: profile_id,
    });
    plan_repository.findOne.mockResolvedValue({ id: plan_id, name: "Pro" });
  });

  describe("customer.subscription.updated", () => {
    it("envía welcome en la transición incomplete -> active", async () => {
      subscription_repository.findByStripeSubscriptionId.mockResolvedValue({
        plan_id,
        status: "incomplete",
        cancel_at_period_end: false,
      });

      await dispatch("customer.subscription.updated", buildSubscription());

      expect(mail_service.enqueueSubscriptionWelcome).toHaveBeenCalledTimes(1);
      expect(mail_service.enqueueSubscriptionWelcome).toHaveBeenCalledWith({
        to: "user@example.com",
        plan_name: "Pro",
        is_new_guest_user: false,
      });
      expect(provisioning_service.syncSubscriptionRecord).toHaveBeenCalled();
    });

    it("envía welcome en la transición incomplete -> trialing", async () => {
      subscription_repository.findByStripeSubscriptionId.mockResolvedValue({
        plan_id,
        status: "incomplete",
        cancel_at_period_end: false,
      });

      await dispatch(
        "customer.subscription.updated",
        buildSubscription({ status: "trialing" }),
      );

      expect(mail_service.enqueueSubscriptionWelcome).toHaveBeenCalledTimes(1);
    });

    it("envía welcome si la primera vez que vemos la sub ya llega activa (trial sin cobro)", async () => {
      subscription_repository.findByStripeSubscriptionId.mockResolvedValue(null);

      await dispatch(
        "customer.subscription.created",
        buildSubscription({ status: "trialing" }),
      );

      expect(mail_service.enqueueSubscriptionWelcome).toHaveBeenCalledTimes(1);
    });

    it("no reenvía welcome en updates posteriores de una sub ya activa", async () => {
      subscription_repository.findByStripeSubscriptionId.mockResolvedValue({
        plan_id,
        status: "active",
        cancel_at_period_end: false,
      });

      await dispatch("customer.subscription.updated", buildSubscription());

      expect(mail_service.enqueueSubscriptionWelcome).not.toHaveBeenCalled();
    });

    it("no envía welcome mientras la sub sigue incomplete", async () => {
      subscription_repository.findByStripeSubscriptionId.mockResolvedValue({
        plan_id,
        status: "incomplete",
        cancel_at_period_end: false,
      });

      await dispatch(
        "customer.subscription.updated",
        buildSubscription({ status: "incomplete" }),
      );

      expect(mail_service.enqueueSubscriptionWelcome).not.toHaveBeenCalled();
    });

    it("no duplica el welcome del flujo Checkout (sin checkout_source)", async () => {
      subscription_repository.findByStripeSubscriptionId.mockResolvedValue({
        plan_id,
        status: "incomplete",
        cancel_at_period_end: false,
      });

      await dispatch(
        "customer.subscription.updated",
        buildSubscription({
          metadata: { profile_id, plan_id, plan_version_id: "version-1" },
        }),
      );

      expect(mail_service.enqueueSubscriptionWelcome).not.toHaveBeenCalled();
    });
  });

  describe("customer.subscription.deleted", () => {
    it("omite revocación y aviso de fin si la sub nunca pasó de incomplete", async () => {
      subscription_repository.findByStripeSubscriptionId.mockResolvedValue({
        plan_id,
        status: "incomplete",
        cancel_at_period_end: false,
      });

      await dispatch(
        "customer.subscription.deleted",
        buildSubscription({ status: "canceled" }),
      );

      expect(provisioning_service.revokePlanEntitlements).not.toHaveBeenCalled();
      expect(mail_service.enqueueSubscriptionEnded).not.toHaveBeenCalled();
    });

    it("mantiene el comportamiento actual para subs que sí estuvieron activas", async () => {
      subscription_repository.findByStripeSubscriptionId.mockResolvedValue({
        plan_id,
        status: "active",
        cancel_at_period_end: false,
      });

      await dispatch(
        "customer.subscription.deleted",
        buildSubscription({ status: "canceled" }),
      );

      expect(provisioning_service.revokePlanEntitlements).toHaveBeenCalledWith(
        profile_id,
      );
      expect(mail_service.enqueueSubscriptionEnded).toHaveBeenCalledWith({
        to: "user@example.com",
        plan_name: "Pro",
      });
    });
  });

  describe("invoice.payment_failed", () => {
    const buildInvoice = (billing_reason: string) => ({
      id: "in_1",
      customer: customer_id,
      amount_paid: 0,
      currency: "eur",
      billing_reason,
      invoice_pdf: null,
      hosted_invoice_url: null,
    });

    it("no envía mail ni crea portal si billing_reason es subscription_create", async () => {
      await dispatch("invoice.payment_failed", buildInvoice("subscription_create"));

      expect(invoice_repository.upsert).toHaveBeenCalledTimes(1);
      expect(stripe_client.createPortalSession).not.toHaveBeenCalled();
      expect(mail_service.enqueueSubscriptionPaymentFailed).not.toHaveBeenCalled();
    });

    it("sigue avisando en fallos de renovación (subscription_cycle)", async () => {
      subscription_repository.findActiveByProfileId.mockResolvedValue({
        plan_name: "Pro",
      });
      stripe_client.createPortalSession.mockResolvedValue("https://portal");

      await dispatch("invoice.payment_failed", buildInvoice("subscription_cycle"));

      expect(mail_service.enqueueSubscriptionPaymentFailed).toHaveBeenCalledWith({
        to: "user@example.com",
        plan_name: "Pro",
        portal_url: "https://portal",
      });
    });
  });
});
