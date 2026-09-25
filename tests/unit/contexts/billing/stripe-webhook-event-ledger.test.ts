import { BadRequestException, ConflictException, Logger } from "@nestjs/common";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock(
  "@/src/contexts/vehicles/repositories/typeorm.vehicle-repository",
  () => ({
    TypeOrmVehicleRepository: class TypeOrmVehicleRepository {
      readonly mocked = true;
    },
  }),
);

import {
  STRIPE_WEBHOOK_STALE_CLAIM_MS,
  StripeWebhookService,
} from "@/src/contexts/billing/services/stripe-webhook.service";
import {
  STRIPE_WEBHOOK_CLAIM_OUTCOME,
  TypeOrmStripeWebhookEventRepository,
} from "@/src/contexts/billing/repositories/typeorm.billing-support-repositories";
import { STRIPE_WEBHOOK_EVENT_STATUS } from "@/src/contexts/billing/types/billing.enums";

const profile_id = "14f04126-a751-4cc0-851a-dfc5c9bf98b0";
const plan_id = "223ac813-eb7e-4c0e-9dc4-f8d89c365286";
const event_id = "evt_ledger_1";

describe("StripeWebhookService event ledger", () => {
  const stripe_client = { constructWebhookEvent: vi.fn() };
  const webhook_event_repository = {
    claim: vi.fn(),
    markProcessed: vi.fn(),
    markFailed: vi.fn(),
  };
  const subscription_repository = { findByStripeSubscriptionId: vi.fn() };
  const provisioning_service = {
    resolveProfileIdFromSubscription: vi.fn(),
    syncSubscriptionRecord: vi.fn(),
    applyPlanEntitlements: vi.fn(),
    linkDealershipPlan: vi.fn(),
    isActiveSubscriptionStatus: vi.fn(),
  };
  const me_session_cache_service = { invalidateByProfileId: vi.fn() };

  const createService = () =>
    new StripeWebhookService(
      stripe_client as never,
      webhook_event_repository as never,
      subscription_repository as never,
      {} as never, // billing_profile_repository
      {} as never, // plan_repository
      {} as never, // invoice_repository
      {} as never, // purchase_repository
      provisioning_service as never,
      {} as never, // billing_notification_mail_service
      {} as never, // vehicle_repository
      {} as never, // pack_repository_entity
      {} as never, // offer_repository_entity
      {} as never, // vehicle_search_indexer
      {} as never, // assistant_quota_service
      {} as never, // featured_listing_credits_service
      me_session_cache_service as never,
    );

  const subscriptionEvent = (type = "customer.subscription.updated") => ({
    id: event_id,
    type,
    data: {
      object: {
        id: "sub_1",
        status: "active",
        customer: "cus_1",
        cancel_at_period_end: false,
        metadata: { profile_id, plan_id, plan_version_id: "v1" },
        items: { data: [{}] },
      },
    },
  });

  const handle = () => createService().handle(Buffer.from("{}"), "sig");

  const claimAs = (
    outcome: (typeof STRIPE_WEBHOOK_CLAIM_OUTCOME)[keyof typeof STRIPE_WEBHOOK_CLAIM_OUTCOME],
    attempts = 1,
  ) => webhook_event_repository.claim.mockResolvedValue({ outcome, attempts });

  beforeEach(() => {
    vi.resetAllMocks();
    vi.spyOn(Logger.prototype, "error").mockImplementation(() => undefined);
    stripe_client.constructWebhookEvent.mockReturnValue(subscriptionEvent());
    claimAs(STRIPE_WEBHOOK_CLAIM_OUTCOME.CLAIMED);
    provisioning_service.resolveProfileIdFromSubscription.mockResolvedValue(
      profile_id,
    );
    provisioning_service.isActiveSubscriptionStatus.mockReturnValue(true);
    subscription_repository.findByStripeSubscriptionId.mockResolvedValue({
      plan_id,
      status: "active",
      cancel_at_period_end: false,
    });
  });

  it("primer procesamiento exitoso marca el evento como processed", async () => {
    await expect(handle()).resolves.toEqual({ received: true });

    expect(webhook_event_repository.claim).toHaveBeenCalledWith(
      event_id,
      "customer.subscription.updated",
      STRIPE_WEBHOOK_STALE_CLAIM_MS,
    );
    expect(provisioning_service.syncSubscriptionRecord).toHaveBeenCalledTimes(1);
    expect(webhook_event_repository.markProcessed).toHaveBeenCalledWith(event_id);
    expect(webhook_event_repository.markFailed).not.toHaveBeenCalled();
  });

  it("evento ya procesado se omite con 2xx sin volver a ejecutar efectos", async () => {
    claimAs(STRIPE_WEBHOOK_CLAIM_OUTCOME.ALREADY_PROCESSED);

    await expect(handle()).resolves.toEqual({ received: true });

    expect(provisioning_service.syncSubscriptionRecord).not.toHaveBeenCalled();
    expect(webhook_event_repository.markProcessed).not.toHaveBeenCalled();
    expect(webhook_event_repository.markFailed).not.toHaveBeenCalled();
  });

  it("si el handler falla marca failed y propaga el error (no se marca processed)", async () => {
    provisioning_service.syncSubscriptionRecord.mockRejectedValueOnce(
      new Error("db down"),
    );

    await expect(handle()).rejects.toThrow("db down");

    expect(webhook_event_repository.markFailed).toHaveBeenCalledWith(
      event_id,
      "db down",
    );
    expect(webhook_event_repository.markProcessed).not.toHaveBeenCalled();
  });

  it("si markFailed también falla se propaga el error original del handler", async () => {
    provisioning_service.syncSubscriptionRecord.mockRejectedValueOnce(
      new Error("handler boom"),
    );
    webhook_event_repository.markFailed.mockRejectedValueOnce(
      new Error("ledger boom"),
    );

    await expect(handle()).rejects.toThrow("handler boom");
  });

  it("evento fallido reintentado por Stripe se vuelve a procesar y queda processed", async () => {
    provisioning_service.syncSubscriptionRecord.mockRejectedValueOnce(
      new Error("transient"),
    );
    await expect(handle()).rejects.toThrow("transient");
    expect(webhook_event_repository.markFailed).toHaveBeenCalledTimes(1);

    claimAs(STRIPE_WEBHOOK_CLAIM_OUTCOME.CLAIMED, 2);
    await expect(handle()).resolves.toEqual({ received: true });

    expect(provisioning_service.syncSubscriptionRecord).toHaveBeenCalledTimes(2);
    expect(webhook_event_repository.markProcessed).toHaveBeenCalledWith(event_id);
  });

  it("duplicado concurrente (processing reciente) responde 409 para que Stripe reintente", async () => {
    claimAs(STRIPE_WEBHOOK_CLAIM_OUTCOME.IN_PROGRESS);

    await expect(handle()).rejects.toBeInstanceOf(ConflictException);

    expect(provisioning_service.syncSubscriptionRecord).not.toHaveBeenCalled();
    expect(webhook_event_repository.markProcessed).not.toHaveBeenCalled();
    expect(webhook_event_repository.markFailed).not.toHaveBeenCalled();
  });

  it("tipo de evento desconocido responde 2xx y queda processed", async () => {
    stripe_client.constructWebhookEvent.mockReturnValue({
      id: event_id,
      type: "customer.created",
      data: { object: {} },
    });

    await expect(handle()).resolves.toEqual({ received: true });

    expect(webhook_event_repository.markProcessed).toHaveBeenCalledWith(event_id);
  });

  it("firma inválida responde 400 sin tocar el ledger", async () => {
    stripe_client.constructWebhookEvent.mockImplementation(() => {
      throw Object.assign(new Error("No signatures found"), {
        type: "StripeSignatureVerificationError",
      });
    });

    await expect(handle()).rejects.toBeInstanceOf(BadRequestException);
    expect(webhook_event_repository.claim).not.toHaveBeenCalled();
  });

  it("sin cabecera stripe-signature responde 400", async () => {
    await expect(
      createService().handle(Buffer.from("{}"), undefined),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(stripe_client.constructWebhookEvent).not.toHaveBeenCalled();
  });
});

describe("TypeOrmStripeWebhookEventRepository.claim", () => {
  const event_repository = {
    query: vi.fn(),
    findOne: vi.fn(),
    update: vi.fn(),
  };
  const repository = new TypeOrmStripeWebhookEventRepository(
    event_repository as never,
  );

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("inserta o re-reclama failed/processing obsoleto en una sola sentencia atómica", async () => {
    event_repository.query.mockResolvedValue([{ attempts: 3 }]);

    const result = await repository.claim(event_id, "invoice.paid", 10 * 60 * 1000);

    expect(result).toEqual({
      outcome: STRIPE_WEBHOOK_CLAIM_OUTCOME.CLAIMED,
      attempts: 3,
    });
    const [sql, params] = event_repository.query.mock.calls[0] as [string, unknown[]];
    expect(sql).toContain("ON CONFLICT (\"event_id\") DO UPDATE");
    expect(sql).toContain("make_interval(secs => $5)");
    expect(params).toEqual([
      event_id,
      "invoice.paid",
      STRIPE_WEBHOOK_EVENT_STATUS.PROCESSING,
      STRIPE_WEBHOOK_EVENT_STATUS.FAILED,
      600,
    ]);
    expect(event_repository.findOne).not.toHaveBeenCalled();
  });

  it("sin fila reclamada y estado processed => already_processed", async () => {
    event_repository.query.mockResolvedValue([]);
    event_repository.findOne.mockResolvedValue({
      status: STRIPE_WEBHOOK_EVENT_STATUS.PROCESSED,
      attempts: 1,
    });

    const result = await repository.claim(event_id, "invoice.paid", 600_000);

    expect(result.outcome).toBe(STRIPE_WEBHOOK_CLAIM_OUTCOME.ALREADY_PROCESSED);
  });

  it("sin fila reclamada y estado processing reciente => in_progress", async () => {
    event_repository.query.mockResolvedValue([]);
    event_repository.findOne.mockResolvedValue({
      status: STRIPE_WEBHOOK_EVENT_STATUS.PROCESSING,
      attempts: 1,
    });

    const result = await repository.claim(event_id, "invoice.paid", 600_000);

    expect(result.outcome).toBe(STRIPE_WEBHOOK_CLAIM_OUTCOME.IN_PROGRESS);
  });

  it("markProcessed / markFailed solo transicionan desde processing", async () => {
    await repository.markProcessed(event_id);
    await repository.markFailed(event_id, "x".repeat(5000));

    expect(event_repository.update).toHaveBeenNthCalledWith(
      1,
      { event_id, status: STRIPE_WEBHOOK_EVENT_STATUS.PROCESSING },
      expect.objectContaining({
        status: STRIPE_WEBHOOK_EVENT_STATUS.PROCESSED,
        processed_at: expect.any(Date),
      }),
    );
    const failed_update = event_repository.update.mock.calls[1] as [
      unknown,
      { status: string; last_error: string },
    ];
    expect(failed_update[0]).toEqual({
      event_id,
      status: STRIPE_WEBHOOK_EVENT_STATUS.PROCESSING,
    });
    expect(failed_update[1].status).toBe(STRIPE_WEBHOOK_EVENT_STATUS.FAILED);
    expect(failed_update[1].last_error).toHaveLength(2000);
  });
});
