import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { InjectRepository } from "@nestjs/typeorm";
import { QueryDeepPartialEntity, Repository } from "typeorm";

import { BillingInvoiceEntity } from "../entities/billing-invoice.entity";
import { OneTimePurchaseEntity } from "../entities/one-time-purchase.entity";
import { StripeWebhookEventEntity } from "../entities/stripe-webhook-event.entity";
import { STRIPE_WEBHOOK_EVENT_STATUS } from "../types/billing.enums";

const STRIPE_WEBHOOK_LAST_ERROR_MAX_LENGTH = 2000;

export const STRIPE_WEBHOOK_CLAIM_OUTCOME = {
  CLAIMED: "claimed",
  ALREADY_PROCESSED: "already_processed",
  IN_PROGRESS: "in_progress",
} as const;

export type StripeWebhookClaimOutcome =
  (typeof STRIPE_WEBHOOK_CLAIM_OUTCOME)[keyof typeof STRIPE_WEBHOOK_CLAIM_OUTCOME];

export interface StripeWebhookEventClaim {
  outcome: StripeWebhookClaimOutcome;
  attempts: number;
}
import { ProfileEntity } from "@/src/contexts/profiles/entities/profile.entity";

@Injectable()
export class TypeOrmBillingInvoiceRepository {
  constructor(
    @InjectRepository(BillingInvoiceEntity)
    private readonly invoice_repository: Repository<BillingInvoiceEntity>,
  ) {
  }

  async upsert(data: {
    profile_id: string;
    stripe_invoice_id: string;
    amount_paid_cents: number;
    currency: string;
    status: string;
    invoice_pdf_url: string | null;
    hosted_invoice_url: string | null;
    paid_at: Date | null;
  }): Promise<void> {
    const existing = await this.invoice_repository.findOne({
      where: { stripe_invoice_id: data.stripe_invoice_id },
    });

    if (existing) {
      const preloaded = await this.invoice_repository.preload({
        id: existing.id,
        profile_id: data.profile_id,
        amount_paid_cents: data.amount_paid_cents,
        currency: data.currency,
        status: data.status as BillingInvoiceEntity["status"],
        invoice_pdf_url: data.invoice_pdf_url,
        hosted_invoice_url: data.hosted_invoice_url,
        paid_at: data.paid_at,
      });

      if (preloaded) {
        await this.invoice_repository.save(preloaded);
      }
      return;
    }

    await this.invoice_repository.save({
      profile_id: data.profile_id,
      stripe_invoice_id: data.stripe_invoice_id,
      amount_paid_cents: data.amount_paid_cents,
      currency: data.currency,
      status: data.status as BillingInvoiceEntity["status"],
      invoice_pdf_url: data.invoice_pdf_url,
      hosted_invoice_url: data.hosted_invoice_url,
      paid_at: data.paid_at,
    });
  }

  async findByProfileId(profile_id: string): Promise<any> {
    const rows = await this.invoice_repository.find({
      where: { profile_id },
      order: { created_at: "DESC" },
    });

    return rows.map((row) => ({
      id: row.id,
      stripe_invoice_id: row.stripe_invoice_id,
      amount_paid_cents: row.amount_paid_cents,
      currency: row.currency,
      status: row.status,
      invoice_pdf_url: row.invoice_pdf_url,
      hosted_invoice_url: row.hosted_invoice_url,
      paid_at: row.paid_at,
      created_at: row.created_at,
    }));
  }
}

@Injectable()
export class TypeOrmOneTimePurchaseRepository {
  constructor(
    @InjectRepository(OneTimePurchaseEntity)
    private readonly purchase_repository: Repository<OneTimePurchaseEntity>,
  ) {
  }

  async create(data: {
    profile_id: string;
    plan_id?: string | null;
    product_kind?: string | null;
    product_id?: string | null;
    stripe_payment_intent_id: string | null;
    status: string;
    metadata: Record<string, unknown>;
  }): Promise<string> {
    if (data.stripe_payment_intent_id) {
      const existing = await this.findByStripePaymentIntentId(
        data.stripe_payment_intent_id,
      );

      if (existing) {
        return existing.id;
      }
    }

    const created = await this.purchase_repository.save({
      profile_id: data.profile_id,
      plan_id: data.plan_id ?? null,
      product_kind: (data.product_kind as OneTimePurchaseEntity["product_kind"]) ?? null,
      product_id: data.product_id ?? null,
      stripe_payment_intent_id: data.stripe_payment_intent_id,
      status: data.status as OneTimePurchaseEntity["status"],
      metadata: data.metadata,
    });

    return created.id;
  }

  /**
   * Atomically inserts the purchase for a PaymentIntent. Returns `true` only for
   * the caller that created the row; concurrent or replayed webhooks for the
   * same PaymentIntent get `false` (relies on UQ_one_time_purchases_payment_intent).
   */
  async claim(data: {
    profile_id: string;
    plan_id?: string | null;
    product_kind?: string | null;
    product_id?: string | null;
    stripe_payment_intent_id: string;
    status: string;
    metadata: Record<string, unknown>;
  }): Promise<boolean> {
    const result = await this.purchase_repository
      .createQueryBuilder()
      .insert()
      .into(OneTimePurchaseEntity)
      .values({
        profile_id: data.profile_id,
        plan_id: data.plan_id ?? null,
        product_kind:
          (data.product_kind as OneTimePurchaseEntity["product_kind"]) ?? null,
        product_id: data.product_id ?? null,
        stripe_payment_intent_id: data.stripe_payment_intent_id,
        status: data.status as OneTimePurchaseEntity["status"],
        // QueryDeepPartialEntity no acepta Record<string, unknown> para jsonb.
        metadata: data.metadata as QueryDeepPartialEntity<
          OneTimePurchaseEntity["metadata"]
        >,
      })
      .orIgnore()
      .returning(["id"])
      .execute();

    const rows = Array.isArray(result.raw) ? result.raw : [];
    return rows.length > 0;
  }

  async findByStripePaymentIntentId(stripe_payment_intent_id: string) {
    const purchase = await this.purchase_repository.findOne({
      where: { stripe_payment_intent_id },
      order: { created_at: "DESC" },
    });

    if (!purchase) {
      return null;
    }

    return {
      id: purchase.id,
      metadata: purchase.metadata ?? {},
    };
  }

  /**
   * Purchases fulfilled from a Checkout Session without PaymentIntent (e.g. a
   * 100% discounted session) are keyed by the session id stored in metadata.
   */
  async findByStripeCheckoutSessionId(stripe_checkout_session_id: string) {
    const purchase = await this.purchase_repository
      .createQueryBuilder("purchase")
      .where("purchase.stripe_payment_intent_id IS NULL")
      .andWhere(
        "purchase.metadata ->> 'stripe_checkout_session_id' = :stripe_checkout_session_id",
        { stripe_checkout_session_id },
      )
      .orderBy("purchase.created_at", "DESC")
      .getOne();

    if (!purchase) {
      return null;
    }

    return {
      id: purchase.id,
      metadata: purchase.metadata ?? {},
    };
  }

  async markEffectAppliedById(purchase_id: string): Promise<void> {
    const purchase = await this.purchase_repository.findOne({
      where: { id: purchase_id },
    });

    if (!purchase) {
      return;
    }

    await this.saveEffectApplied(purchase);
  }

  async markEffectApplied(stripe_payment_intent_id: string): Promise<void> {
    const purchase = await this.purchase_repository.findOne({
      where: { stripe_payment_intent_id },
      order: { created_at: "DESC" },
    });

    if (!purchase) {
      return;
    }

    await this.saveEffectApplied(purchase);
  }

  private async saveEffectApplied(purchase: OneTimePurchaseEntity): Promise<void> {
    const preloaded = await this.purchase_repository.preload({
      id: purchase.id,
      metadata: {
        ...purchase.metadata,
        effect_applied: true,
      },
    });

    if (preloaded) {
      await this.purchase_repository.save(preloaded);
    }
  }
}

@Injectable()
export class TypeOrmStripeWebhookEventRepository {
  constructor(
    @InjectRepository(StripeWebhookEventEntity)
    private readonly event_repository: Repository<StripeWebhookEventEntity>,
  ) {
  }

  /**
   * Atomically claims a Stripe event for processing (single statement, so two
   * concurrent deliveries can never both win):
   * - new event            -> inserted as `processing`, claimed
   * - `failed`             -> re-claimed (attempts + 1)
   * - `processing` & stale -> re-claimed (previous worker crashed/timed out)
   * - `processed`          -> not claimed, outcome `already_processed`
   * - `processing` & fresh -> not claimed, outcome `in_progress`
   */
  async claim(
    event_id: string,
    event_type: string,
    stale_after_ms: number,
  ): Promise<StripeWebhookEventClaim> {
    const stale_after_seconds = Math.max(1, Math.floor(stale_after_ms / 1000));
    const claimed_rows: unknown = await this.event_repository.query(
      `
        INSERT INTO "stripe_webhook_events"
          ("event_id", "event_type", "status", "attempts", "claimed_at")
        VALUES ($1, $2, $3, 1, now())
        ON CONFLICT ("event_id") DO UPDATE
        SET "status" = $3,
            "attempts" = "stripe_webhook_events"."attempts" + 1,
            "claimed_at" = now()
        WHERE "stripe_webhook_events"."status" = $4
           OR (
             "stripe_webhook_events"."status" = $3
             AND "stripe_webhook_events"."claimed_at"
               < now() - make_interval(secs => $5)
           )
        RETURNING "attempts"
      `,
      [
        event_id,
        event_type,
        STRIPE_WEBHOOK_EVENT_STATUS.PROCESSING,
        STRIPE_WEBHOOK_EVENT_STATUS.FAILED,
        stale_after_seconds,
      ],
    );

    if (Array.isArray(claimed_rows) && claimed_rows.length > 0) {
      const row = claimed_rows[0] as { attempts: number | string };
      return {
        outcome: STRIPE_WEBHOOK_CLAIM_OUTCOME.CLAIMED,
        attempts: Number(row.attempts),
      };
    }

    const existing = await this.event_repository.findOne({
      where: { event_id },
      select: { id: true, status: true, attempts: true },
    });

    // Row vanished between statements (should not happen): let Stripe retry.
    if (!existing || existing.status !== STRIPE_WEBHOOK_EVENT_STATUS.PROCESSED) {
      return {
        outcome: STRIPE_WEBHOOK_CLAIM_OUTCOME.IN_PROGRESS,
        attempts: existing?.attempts ?? 0,
      };
    }

    return {
      outcome: STRIPE_WEBHOOK_CLAIM_OUTCOME.ALREADY_PROCESSED,
      attempts: existing.attempts,
    };
  }

  async markProcessed(event_id: string): Promise<void> {
    await this.event_repository.update(
      { event_id, status: STRIPE_WEBHOOK_EVENT_STATUS.PROCESSING },
      {
        status: STRIPE_WEBHOOK_EVENT_STATUS.PROCESSED,
        processed_at: new Date(),
        last_error: null,
      },
    );
  }

  async markFailed(event_id: string, error_message: string): Promise<void> {
    await this.event_repository.update(
      { event_id, status: STRIPE_WEBHOOK_EVENT_STATUS.PROCESSING },
      {
        status: STRIPE_WEBHOOK_EVENT_STATUS.FAILED,
        last_error: error_message.slice(0, STRIPE_WEBHOOK_LAST_ERROR_MAX_LENGTH),
      },
    );
  }
}

@Injectable()
export class TypeOrmBillingProfileRepository {
  constructor(
    @InjectRepository(ProfileEntity)
    private readonly profile_repository: Repository<ProfileEntity>,
  ) {
  }

  async findById(profile_id: string) {
    const profile = await this.profile_repository.findOne({
      where: { id: profile_id },
      relations: { user: true },
    });

    if (!profile) {
      return null;
    }

    return {
      id: profile.id,
      stripe_customer_id: profile.stripe_customer_id,
      is_admin: profile.user?.is_admin === true,
      email: profile.user.email,
      name: profile.name,
      type: profile.type,
    };
  }

  async updateStripeCustomerId(profile_id: string, stripe_customer_id: string): Promise<void> {
    const preloaded = await this.profile_repository.preload({
      id: profile_id,
      stripe_customer_id,
    });

    if (preloaded) {
      await this.profile_repository.save(preloaded);
    }
  }

  async updatePublisherType(profile_id: string, type: string): Promise<void> {
    const preloaded = await this.profile_repository.preload({
      id: profile_id,
      type: type as ProfileEntity["type"],
    });

    if (preloaded) {
      await this.profile_repository.save(preloaded);
    }
  }

  async findByEmail(email: string) {
    const profile = await this.profile_repository.findOne({
      where: { user: { email } },
      relations: { user: true },
    });

    if (!profile) {
      return null;
    }

    return {
      id: profile.id,
      stripe_customer_id: profile.stripe_customer_id,
      is_admin: profile.user?.is_admin === true,
      email: profile.user.email,
      name: profile.name,
      type: profile.type,
    };
  }

  async findByStripeCustomerId(stripe_customer_id: string) {
    const profile = await this.profile_repository.findOne({
      where: { stripe_customer_id },
    });

    return profile ? { id: profile.id } : null;
  }
}
