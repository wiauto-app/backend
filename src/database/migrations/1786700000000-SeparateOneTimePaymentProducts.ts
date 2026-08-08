import { MigrationInterface, QueryRunner } from "typeorm";

export class SeparateOneTimePaymentProducts1786700000000
  implements MigrationInterface
{
  name = "SeparateOneTimePaymentProducts1786700000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "assistant_credit_packs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "title" character varying NOT NULL,
        "description" text,
        "credits_quantity" integer NOT NULL,
        "amount_cents" integer NOT NULL,
        "currency" character varying(3) NOT NULL DEFAULT 'eur',
        "stripe_product_id" character varying,
        "stripe_price_id" character varying,
        "is_active" boolean NOT NULL DEFAULT true,
        "sort_order" integer NOT NULL DEFAULT 0,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_assistant_credit_packs" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "featured_listing_offers" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "title" character varying NOT NULL,
        "description" text,
        "duration_days" integer NOT NULL,
        "boost_weight" integer NOT NULL DEFAULT 50,
        "amount_cents" integer NOT NULL,
        "currency" character varying(3) NOT NULL DEFAULT 'eur',
        "stripe_product_id" character varying,
        "stripe_price_id" character varying,
        "is_active" boolean NOT NULL DEFAULT true,
        "sort_order" integer NOT NULL DEFAULT 0,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_featured_listing_offers" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "vehicles"
      ADD "featured_boost_weight" integer
    `);

    await queryRunner.query(`
      CREATE TYPE "public"."one_time_product_kind_enum" AS ENUM(
        'assistant_credit_pack',
        'featured_listing_offer'
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "one_time_purchases"
      ADD "product_kind" "public"."one_time_product_kind_enum"
    `);

    await queryRunner.query(`
      ALTER TABLE "one_time_purchases"
      ADD "product_id" uuid
    `);

    await queryRunner.query(`
      ALTER TABLE "one_time_purchases"
      DROP CONSTRAINT "FK_one_time_purchases_plan"
    `);

    await queryRunner.query(`
      ALTER TABLE "one_time_purchases"
      ALTER COLUMN "plan_id" DROP NOT NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "one_time_purchases"
      ADD CONSTRAINT "FK_one_time_purchases_plan"
      FOREIGN KEY ("plan_id") REFERENCES "subscription_plans"("id")
      ON DELETE RESTRICT ON UPDATE NO ACTION
    `);

    // Migrate legacy one_time subscription_plans → assistant_credit_packs
    await queryRunner.query(`
      INSERT INTO "assistant_credit_packs" (
        "id",
        "title",
        "description",
        "credits_quantity",
        "amount_cents",
        "currency",
        "stripe_product_id",
        "stripe_price_id",
        "is_active",
        "sort_order",
        "created_at",
        "updated_at"
      )
      SELECT
        sp.id,
        sp.name,
        sp.description,
        GREATEST(COALESCE((sp.effect_config->>'credits')::int, 1), 1),
        COALESCE(price.amount_cents, 100),
        COALESCE(price.currency, 'eur'),
        sp.stripe_product_id,
        price.stripe_price_id,
        sp.is_active,
        sp.sort_order,
        sp.created_at,
        sp.updated_at
      FROM "subscription_plans" sp
      LEFT JOIN LATERAL (
        SELECT spp.amount_cents, spp.currency, spp.stripe_price_id
        FROM "subscription_plan_prices" spp
        WHERE spp.plan_id = sp.id AND spp.is_active = true
        ORDER BY spp.created_at ASC
        LIMIT 1
      ) price ON true
      WHERE sp.billing_type = 'one_time'
        AND sp.effect_config->>'type' = 'assistant_credits'
    `);

    // Migrate legacy one_time subscription_plans → featured_listing_offers
    await queryRunner.query(`
      INSERT INTO "featured_listing_offers" (
        "id",
        "title",
        "description",
        "duration_days",
        "boost_weight",
        "amount_cents",
        "currency",
        "stripe_product_id",
        "stripe_price_id",
        "is_active",
        "sort_order",
        "created_at",
        "updated_at"
      )
      SELECT
        sp.id,
        sp.name,
        sp.description,
        30,
        50,
        COALESCE(price.amount_cents, 100),
        COALESCE(price.currency, 'eur'),
        sp.stripe_product_id,
        price.stripe_price_id,
        sp.is_active,
        sp.sort_order,
        sp.created_at,
        sp.updated_at
      FROM "subscription_plans" sp
      LEFT JOIN LATERAL (
        SELECT spp.amount_cents, spp.currency, spp.stripe_price_id
        FROM "subscription_plan_prices" spp
        WHERE spp.plan_id = sp.id AND spp.is_active = true
        ORDER BY spp.created_at ASC
        LIMIT 1
      ) price ON true
      WHERE sp.billing_type = 'one_time'
        AND sp.effect_config->>'type' = 'feature_vehicle'
    `);

    // Backfill ledger product_kind/product_id from legacy plan_id
    await queryRunner.query(`
      UPDATE "one_time_purchases" otp
      SET
        "product_kind" = 'assistant_credit_pack',
        "product_id" = otp.plan_id
      FROM "subscription_plans" sp
      WHERE otp.plan_id = sp.id
        AND sp.billing_type = 'one_time'
        AND sp.effect_config->>'type' = 'assistant_credits'
    `);

    await queryRunner.query(`
      UPDATE "one_time_purchases" otp
      SET
        "product_kind" = 'featured_listing_offer',
        "product_id" = otp.plan_id
      FROM "subscription_plans" sp
      WHERE otp.plan_id = sp.id
        AND sp.billing_type = 'one_time'
        AND sp.effect_config->>'type' = 'feature_vehicle'
    `);

    // Deactivate legacy one_time plans (keep rows for FK history)
    await queryRunner.query(`
      UPDATE "subscription_plans"
      SET "is_active" = false
      WHERE "billing_type" = 'one_time'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "one_time_purchases"
      DROP CONSTRAINT "FK_one_time_purchases_plan"
    `);

    await queryRunner.query(`
      UPDATE "one_time_purchases"
      SET "plan_id" = "product_id"
      WHERE "plan_id" IS NULL AND "product_id" IS NOT NULL
    `);

    await queryRunner.query(`
      DELETE FROM "one_time_purchases"
      WHERE "plan_id" IS NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "one_time_purchases"
      ALTER COLUMN "plan_id" SET NOT NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "one_time_purchases"
      ADD CONSTRAINT "FK_one_time_purchases_plan"
      FOREIGN KEY ("plan_id") REFERENCES "subscription_plans"("id")
      ON DELETE RESTRICT ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "one_time_purchases" DROP COLUMN "product_id"
    `);

    await queryRunner.query(`
      ALTER TABLE "one_time_purchases" DROP COLUMN "product_kind"
    `);

    await queryRunner.query(`
      DROP TYPE "public"."one_time_product_kind_enum"
    `);

    await queryRunner.query(`
      ALTER TABLE "vehicles" DROP COLUMN "featured_boost_weight"
    `);

    await queryRunner.query(`DROP TABLE "featured_listing_offers"`);
    await queryRunner.query(`DROP TABLE "assistant_credit_packs"`);
  }
}
