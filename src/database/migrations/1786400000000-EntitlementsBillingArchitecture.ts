import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Schema + seed/backfill for Plan → PlanVersion → Entitlements → Overrides + Usage.
 */
export class EntitlementsBillingArchitecture1786400000000
  implements MigrationInterface
{
  name = "EntitlementsBillingArchitecture1786400000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "public"."entitlement_value_type_enum" AS ENUM('boolean', 'limit', 'unlimited')
    `);
    await queryRunner.query(`
      CREATE TYPE "public"."plan_version_status_enum" AS ENUM('draft', 'published', 'archived')
    `);
    await queryRunner.query(`
      CREATE TYPE "public"."subscription_plan_type_enum" AS ENUM('standard', 'custom')
    `);
    await queryRunner.query(`
      CREATE TYPE "public"."plan_lead_status_enum" AS ENUM(
        'pending', 'contacted', 'proposal_sent', 'accepted', 'rejected', 'cancelled'
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "plan_versions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "plan_id" uuid NOT NULL,
        "version" integer NOT NULL,
        "status" "public"."plan_version_status_enum" NOT NULL DEFAULT 'draft',
        "published_at" TIMESTAMP,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_plan_versions_plan_version" UNIQUE ("plan_id", "version"),
        CONSTRAINT "PK_plan_versions" PRIMARY KEY ("id"),
        CONSTRAINT "FK_plan_versions_plan"
          FOREIGN KEY ("plan_id") REFERENCES "subscription_plans"("id")
          ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "plan_entitlements" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "plan_version_id" uuid NOT NULL,
        "feature" character varying NOT NULL,
        "value_type" "public"."entitlement_value_type_enum" NOT NULL,
        "value" jsonb NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_plan_entitlements_version_feature" UNIQUE ("plan_version_id", "feature"),
        CONSTRAINT "PK_plan_entitlements" PRIMARY KEY ("id"),
        CONSTRAINT "FK_plan_entitlements_plan_version"
          FOREIGN KEY ("plan_version_id") REFERENCES "plan_versions"("id")
          ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "subscription_entitlement_overrides" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "subscription_id" uuid NOT NULL,
        "feature" character varying NOT NULL,
        "value_type" "public"."entitlement_value_type_enum" NOT NULL,
        "value" jsonb NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_subscription_entitlement_overrides_sub_feature"
          UNIQUE ("subscription_id", "feature"),
        CONSTRAINT "PK_subscription_entitlement_overrides" PRIMARY KEY ("id"),
        CONSTRAINT "FK_subscription_entitlement_overrides_subscription"
          FOREIGN KEY ("subscription_id") REFERENCES "subscriptions"("id")
          ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "subscription_usage" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "subscription_id" uuid NOT NULL,
        "feature" character varying NOT NULL,
        "period_start" TIMESTAMP NOT NULL,
        "period_end" TIMESTAMP NOT NULL,
        "used" integer NOT NULL DEFAULT 0,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_subscription_usage_sub_feature_period"
          UNIQUE ("subscription_id", "feature", "period_start"),
        CONSTRAINT "PK_subscription_usage" PRIMARY KEY ("id"),
        CONSTRAINT "FK_subscription_usage_subscription"
          FOREIGN KEY ("subscription_id") REFERENCES "subscriptions"("id")
          ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "subscription_plans"
      ADD COLUMN "slug" character varying
    `);
    await queryRunner.query(`
      ALTER TABLE "subscription_plans"
      ADD CONSTRAINT "UQ_subscription_plans_slug" UNIQUE ("slug")
    `);
    await queryRunner.query(`
      ALTER TABLE "subscription_plans"
      ADD COLUMN "type" "public"."subscription_plan_type_enum" NOT NULL DEFAULT 'standard'
    `);

    await queryRunner.query(`
      ALTER TABLE "subscriptions"
      ADD COLUMN "plan_version_id" uuid
    `);
    await queryRunner.query(`
      ALTER TABLE "subscriptions"
      ADD COLUMN "stripe_price_id" character varying
    `);

    await queryRunner.query(`
      ALTER TABLE "plan_lead_requests"
      ADD COLUMN "profile_id" uuid
    `);
    await queryRunner.query(`
      ALTER TABLE "plan_lead_requests"
      ADD COLUMN "status" "public"."plan_lead_status_enum" NOT NULL DEFAULT 'pending'
    `);
    await queryRunner.query(`
      ALTER TABLE "plan_lead_requests"
      ADD COLUMN "base_plan_id" uuid
    `);
    await queryRunner.query(`
      ALTER TABLE "plan_lead_requests"
      ADD COLUMN "proposed_price_cents" integer
    `);
    await queryRunner.query(`
      ALTER TABLE "plan_lead_requests"
      ADD COLUMN "proposed_interval" "public"."subscription_plan_price_interval_enum"
    `);
    await queryRunner.query(`
      ALTER TABLE "plan_lead_requests"
      ADD COLUMN "proposed_stripe_price_id" character varying
    `);
    await queryRunner.query(`
      ALTER TABLE "plan_lead_requests"
      ADD COLUMN "proposal_notes" text
    `);
    await queryRunner.query(`
      ALTER TABLE "plan_lead_requests"
      ADD COLUMN "proposed_overrides" jsonb
    `);

    await queryRunner.query(`
      ALTER TABLE "subscriptions"
      ADD CONSTRAINT "FK_subscriptions_plan_version"
        FOREIGN KEY ("plan_version_id") REFERENCES "plan_versions"("id")
        ON DELETE RESTRICT ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "plan_lead_requests"
      ADD CONSTRAINT "FK_plan_lead_requests_profile"
        FOREIGN KEY ("profile_id") REFERENCES "profile"("id")
        ON DELETE SET NULL ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "plan_lead_requests"
      ADD CONSTRAINT "FK_plan_lead_requests_base_plan"
        FOREIGN KEY ("base_plan_id") REFERENCES "subscription_plans"("id")
        ON DELETE SET NULL ON UPDATE NO ACTION
    `);

    // --- Seed / backfill ---

    await queryRunner.query(`
      UPDATE "subscription_plans" AS p
      SET "slug" = lower(regexp_replace(trim(p."name"), '[^a-zA-Z0-9]+', '-', 'g'))
      WHERE p."slug" IS NULL
    `);

    await queryRunner.query(`
      UPDATE "subscription_plans" AS p
      SET "slug" = p."slug" || '-' || left(replace(p."id"::text, '-', ''), 8)
      WHERE p."id" IN (
        SELECT a."id"
        FROM "subscription_plans" a
        INNER JOIN "subscription_plans" b ON a."slug" = b."slug" AND a."id" <> b."id"
      )
    `);

    // One published v1 per plan
    await queryRunner.query(`
      INSERT INTO "plan_versions" ("plan_id", "version", "status", "published_at")
      SELECT p."id", 1, 'published', now()
      FROM "subscription_plans" p
    `);

    // Entitlements from dealership quotas aggregated by billing_plan_id, else FREE defaults
    await queryRunner.query(`
      WITH plan_quotas AS (
        SELECT
          p."id" AS plan_id,
          COALESCE(MAX(d."max_listings"), 3) AS max_listings,
          COALESCE(MAX(d."max_photos"), 6) AS max_photos,
          COALESCE(BOOL_OR(d."allow_videos"), false) AS allow_videos
        FROM "subscription_plans" p
        LEFT JOIN "dealerships" d ON d."billing_plan_id" = p."id"
        GROUP BY p."id"
      )
      INSERT INTO "plan_entitlements" ("plan_version_id", "feature", "value_type", "value")
      SELECT
        v."id",
        f.feature,
        f.value_type::"public"."entitlement_value_type_enum",
        f.value::jsonb
      FROM "plan_versions" v
      INNER JOIN plan_quotas q ON q.plan_id = v."plan_id"
      CROSS JOIN LATERAL (
        VALUES
          ('vehicles', 'limit', jsonb_build_object('limit', q.max_listings)),
          ('photos_per_vehicle', 'limit', jsonb_build_object('limit', q.max_photos)),
          ('videos_per_vehicle', 'limit', jsonb_build_object('limit', CASE WHEN q.allow_videos THEN 1 ELSE 0 END)),
          ('ai_requests', 'limit', jsonb_build_object('limit', 0)),
          ('users', 'limit', jsonb_build_object('limit', 1)),
          ('video_upload', 'boolean', jsonb_build_object('bool', q.allow_videos)),
          ('ai_generation', 'boolean', jsonb_build_object('bool', false)),
          ('statistics', 'boolean', jsonb_build_object('bool', false)),
          ('featured_listings', 'boolean', jsonb_build_object('bool', false))
      ) AS f(feature, value_type, value)
      WHERE v."version" = 1
    `);

    await queryRunner.query(`
      UPDATE "subscriptions" AS s
      SET "plan_version_id" = v."id"
      FROM "plan_versions" AS v
      WHERE v."plan_id" = s."plan_id"
        AND v."version" = 1
        AND s."plan_version_id" IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "plan_lead_requests" DROP CONSTRAINT IF EXISTS "FK_plan_lead_requests_base_plan"
    `);
    await queryRunner.query(`
      ALTER TABLE "plan_lead_requests" DROP CONSTRAINT IF EXISTS "FK_plan_lead_requests_profile"
    `);
    await queryRunner.query(`
      ALTER TABLE "subscriptions" DROP CONSTRAINT IF EXISTS "FK_subscriptions_plan_version"
    `);

    await queryRunner.query(`
      ALTER TABLE "plan_lead_requests" DROP COLUMN IF EXISTS "proposed_overrides"
    `);
    await queryRunner.query(`
      ALTER TABLE "plan_lead_requests" DROP COLUMN IF EXISTS "proposal_notes"
    `);
    await queryRunner.query(`
      ALTER TABLE "plan_lead_requests" DROP COLUMN IF EXISTS "proposed_stripe_price_id"
    `);
    await queryRunner.query(`
      ALTER TABLE "plan_lead_requests" DROP COLUMN IF EXISTS "proposed_interval"
    `);
    await queryRunner.query(`
      ALTER TABLE "plan_lead_requests" DROP COLUMN IF EXISTS "proposed_price_cents"
    `);
    await queryRunner.query(`
      ALTER TABLE "plan_lead_requests" DROP COLUMN IF EXISTS "base_plan_id"
    `);
    await queryRunner.query(`
      ALTER TABLE "plan_lead_requests" DROP COLUMN IF EXISTS "status"
    `);
    await queryRunner.query(`
      ALTER TABLE "plan_lead_requests" DROP COLUMN IF EXISTS "profile_id"
    `);

    await queryRunner.query(`
      ALTER TABLE "subscriptions" DROP COLUMN IF EXISTS "stripe_price_id"
    `);
    await queryRunner.query(`
      ALTER TABLE "subscriptions" DROP COLUMN IF EXISTS "plan_version_id"
    `);

    await queryRunner.query(`
      ALTER TABLE "subscription_plans" DROP COLUMN IF EXISTS "type"
    `);
    await queryRunner.query(`
      ALTER TABLE "subscription_plans" DROP CONSTRAINT IF EXISTS "UQ_subscription_plans_slug"
    `);
    await queryRunner.query(`
      ALTER TABLE "subscription_plans" DROP COLUMN IF EXISTS "slug"
    `);

    await queryRunner.query(`DROP TABLE IF EXISTS "subscription_usage"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "subscription_entitlement_overrides"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "plan_entitlements"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "plan_versions"`);

    await queryRunner.query(`DROP TYPE IF EXISTS "public"."plan_lead_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."subscription_plan_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."plan_version_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."entitlement_value_type_enum"`);
  }
}
