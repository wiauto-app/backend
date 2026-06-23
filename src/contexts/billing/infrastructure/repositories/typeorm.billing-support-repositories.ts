import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import {
  BillingInvoiceRepository,
  BillingProfileRepository,
  OneTimePurchaseRepository,
  StripeWebhookEventRepository,
} from "../../domain/repositories/billing.repositories";
import { BillingInvoiceEntity } from "../persistence/billing-invoice.entity";
import { OneTimePurchaseEntity } from "../persistence/one-time-purchase.entity";
import { StripeWebhookEventEntity } from "../persistence/stripe-webhook-event.entity";
import { ProfileEntity } from "@/src/contexts/profiles/infrastructure/persistence/profile.entity";

@Injectable()
export class TypeOrmBillingInvoiceRepository extends BillingInvoiceRepository {
  constructor(
    @InjectRepository(BillingInvoiceEntity)
    private readonly invoice_repository: Repository<BillingInvoiceEntity>,
  ) {
    super();
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
export class TypeOrmOneTimePurchaseRepository extends OneTimePurchaseRepository {
  constructor(
    @InjectRepository(OneTimePurchaseEntity)
    private readonly purchase_repository: Repository<OneTimePurchaseEntity>,
  ) {
    super();
  }

  async create(data: {
    profile_id: string;
    plan_id: string;
    stripe_payment_intent_id: string | null;
    status: string;
    metadata: Record<string, unknown>;
  }): Promise<void> {
    await this.purchase_repository.save({
      profile_id: data.profile_id,
      plan_id: data.plan_id,
      stripe_payment_intent_id: data.stripe_payment_intent_id,
      status: data.status as OneTimePurchaseEntity["status"],
      metadata: data.metadata,
    });
  }
}

@Injectable()
export class TypeOrmStripeWebhookEventRepository extends StripeWebhookEventRepository {
  constructor(
    @InjectRepository(StripeWebhookEventEntity)
    private readonly event_repository: Repository<StripeWebhookEventEntity>,
  ) {
    super();
  }

  async exists(event_id: string): Promise<boolean> {
    return this.event_repository.exists({ where: { event_id } });
  }

  async save(event_id: string, event_type: string): Promise<void> {
    await this.event_repository.save({ event_id, event_type });
  }
}

@Injectable()
export class TypeOrmBillingProfileRepository extends BillingProfileRepository {
  constructor(
    @InjectRepository(ProfileEntity)
    private readonly profile_repository: Repository<ProfileEntity>,
  ) {
    super();
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
      role_id: profile.role_id,
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

  async updateRoleId(profile_id: string, role_id: string | null): Promise<void> {
    const preloaded = await this.profile_repository.preload({
      id: profile_id,
      role_id: role_id ?? undefined,
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
      role_id: profile.role_id,
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
