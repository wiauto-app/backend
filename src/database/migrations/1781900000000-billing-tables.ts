import { MigrationInterface, QueryRunner } from "typeorm";

export class BillingTables1781900000000 implements MigrationInterface {
  name = "BillingTables1781900000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "subscription_plan_audience_enum" AS ENUM ('particular', 'professional', 'buyer')
    `);
    await queryRunner.query(`
      CREATE TYPE "subscription_plan_billing_type_enum" AS ENUM ('recurring', 'one_time')
    `);
    await queryRunner.query(`
      CREATE TYPE "subscription_plan_price_interval_enum" AS ENUM ('month', 'year', 'one_time')
    `);
    await queryRunner.query(`
      CREATE TYPE "subscription_status_enum" AS ENUM (
        'active', 'canceled', 'past_due', 'incomplete', 'trialing', 'unpaid', 'incomplete_expired'
      )
    `);
    await queryRunner.query(`
      CREATE TYPE "one_time_purchase_status_enum" AS ENUM ('pending', 'completed', 'failed', 'refunded')
    `);
    await queryRunner.query(`
      CREATE TYPE "billing_invoice_status_enum" AS ENUM ('draft', 'open', 'paid', 'void', 'uncollectible')
    `);

    await queryRunner.query(`
      CREATE TABLE "subscription_plans" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "slug" character varying NOT NULL,
        "name" character varying NOT NULL,
        "description" text,
        "audience" "subscription_plan_audience_enum" NOT NULL,
        "billing_type" "subscription_plan_billing_type_enum" NOT NULL,
        "role_id" uuid,
        "stripe_product_id" character varying,
        "is_active" boolean NOT NULL DEFAULT true,
        "is_featured" boolean NOT NULL DEFAULT false,
        "sort_order" integer NOT NULL DEFAULT 0,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_subscription_plans_slug" UNIQUE ("slug"),
        CONSTRAINT "PK_subscription_plans" PRIMARY KEY ("id"),
        CONSTRAINT "FK_subscription_plans_role" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "subscription_plan_prices" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "plan_id" uuid NOT NULL,
        "interval" "subscription_plan_price_interval_enum" NOT NULL,
        "amount_cents" integer NOT NULL,
        "currency" character varying NOT NULL DEFAULT 'eur',
        "stripe_price_id" character varying,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_subscription_plan_prices" PRIMARY KEY ("id"),
        CONSTRAINT "FK_subscription_plan_prices_plan" FOREIGN KEY ("plan_id") REFERENCES "subscription_plans"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "plan_features" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "plan_id" uuid NOT NULL,
        "label" character varying NOT NULL,
        "description" text,
        "included" boolean NOT NULL DEFAULT true,
        "sort_order" integer NOT NULL DEFAULT 0,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_plan_features" PRIMARY KEY ("id"),
        CONSTRAINT "FK_plan_features_plan" FOREIGN KEY ("plan_id") REFERENCES "subscription_plans"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "subscriptions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "profile_id" uuid NOT NULL,
        "plan_id" uuid NOT NULL,
        "stripe_customer_id" character varying NOT NULL,
        "stripe_subscription_id" character varying NOT NULL,
        "status" "subscription_status_enum" NOT NULL DEFAULT 'incomplete',
        "current_period_start" TIMESTAMP,
        "current_period_end" TIMESTAMP,
        "cancel_at_period_end" boolean NOT NULL DEFAULT false,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_subscriptions_stripe_subscription_id" UNIQUE ("stripe_subscription_id"),
        CONSTRAINT "PK_subscriptions" PRIMARY KEY ("id"),
        CONSTRAINT "FK_subscriptions_profile" FOREIGN KEY ("profile_id") REFERENCES "profile"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_subscriptions_plan" FOREIGN KEY ("plan_id") REFERENCES "subscription_plans"("id") ON DELETE RESTRICT
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "one_time_purchases" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "profile_id" uuid NOT NULL,
        "plan_id" uuid NOT NULL,
        "stripe_payment_intent_id" character varying,
        "status" "one_time_purchase_status_enum" NOT NULL DEFAULT 'pending',
        "metadata" jsonb NOT NULL DEFAULT '{}',
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_one_time_purchases" PRIMARY KEY ("id"),
        CONSTRAINT "FK_one_time_purchases_profile" FOREIGN KEY ("profile_id") REFERENCES "profile"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_one_time_purchases_plan" FOREIGN KEY ("plan_id") REFERENCES "subscription_plans"("id") ON DELETE RESTRICT
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "billing_invoices" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "profile_id" uuid NOT NULL,
        "stripe_invoice_id" character varying NOT NULL,
        "amount_paid_cents" integer NOT NULL DEFAULT 0,
        "currency" character varying NOT NULL DEFAULT 'eur',
        "status" "billing_invoice_status_enum" NOT NULL DEFAULT 'draft',
        "invoice_pdf_url" character varying,
        "hosted_invoice_url" character varying,
        "paid_at" TIMESTAMP,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_billing_invoices_stripe_invoice_id" UNIQUE ("stripe_invoice_id"),
        CONSTRAINT "PK_billing_invoices" PRIMARY KEY ("id"),
        CONSTRAINT "FK_billing_invoices_profile" FOREIGN KEY ("profile_id") REFERENCES "profile"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "stripe_webhook_events" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "event_id" character varying NOT NULL,
        "event_type" character varying NOT NULL,
        "processed_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_stripe_webhook_events_event_id" UNIQUE ("event_id"),
        CONSTRAINT "PK_stripe_webhook_events" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "profile" ADD "stripe_customer_id" character varying
    `);

    await queryRunner.query(`
      INSERT INTO "permissions" ("name", "key", "value", "created_at", "updated_at")
      SELECT x.name, x.key, x.value, now(), now()
      FROM (
        VALUES
          ('Destacados mensuales incluidos', 'vehicles.featured_monthly', 0),
          ('Máximo de fotos por anuncio', 'vehicles.max_photos', 5),
          ('Alertas activas máximas', 'alerts.max_active', 0),
          ('Acceso a estadísticas', 'analytics.view', 1),
          ('Permiso para comprar boost', 'vehicles.boost', 1),
          ('Administrar planes de facturación', 'billing.manage', 1)
      ) AS x(name, key, value)
      WHERE NOT EXISTS (SELECT 1 FROM "permissions" p WHERE p.key = x.key)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "profile" DROP COLUMN "stripe_customer_id"`);
    await queryRunner.query(`DROP TABLE "stripe_webhook_events"`);
    await queryRunner.query(`DROP TABLE "billing_invoices"`);
    await queryRunner.query(`DROP TABLE "one_time_purchases"`);
    await queryRunner.query(`DROP TABLE "subscriptions"`);
    await queryRunner.query(`DROP TABLE "plan_features"`);
    await queryRunner.query(`DROP TABLE "subscription_plan_prices"`);
    await queryRunner.query(`DROP TABLE "subscription_plans"`);
    await queryRunner.query(`
      DELETE FROM "permissions"
      WHERE "key" IN (
        'vehicles.featured_monthly',
        'vehicles.max_photos',
        'alerts.max_active',
        'analytics.view',
        'vehicles.boost',
        'billing.manage'
      )
    `);
    await queryRunner.query(`DROP TYPE "billing_invoice_status_enum"`);
    await queryRunner.query(`DROP TYPE "one_time_purchase_status_enum"`);
    await queryRunner.query(`DROP TYPE "subscription_status_enum"`);
    await queryRunner.query(`DROP TYPE "subscription_plan_price_interval_enum"`);
    await queryRunner.query(`DROP TYPE "subscription_plan_billing_type_enum"`);
    await queryRunner.query(`DROP TYPE "subscription_plan_audience_enum"`);
  }
}
