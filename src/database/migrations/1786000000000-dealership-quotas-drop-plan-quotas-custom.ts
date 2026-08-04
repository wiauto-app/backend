import { MigrationInterface, QueryRunner } from "typeorm";

export class DealershipQuotasDropPlanQuotasCustom1786000000000
  implements MigrationInterface
{
  name = "DealershipQuotasDropPlanQuotasCustom1786000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "dealerships"
      ADD COLUMN "max_listings" integer NOT NULL DEFAULT 3
    `);

    await queryRunner.query(`
      ALTER TABLE "dealerships"
      ADD COLUMN "max_photos" integer NOT NULL DEFAULT 6
    `);

    await queryRunner.query(`
      ALTER TABLE "dealerships"
      ADD COLUMN "allow_videos" boolean NOT NULL DEFAULT false
    `);

    await queryRunner.query(`
      UPDATE "dealerships" AS d
      SET
        "max_listings" = COALESCE(
          (p."quotas"->>'max_listings')::integer,
          d."max_listings"
        ),
        "max_photos" = COALESCE(
          (p."quotas"->>'max_photos')::integer,
          d."max_photos"
        ),
        "allow_videos" = COALESCE(
          (p."quotas"->>'allow_videos')::boolean,
          d."allow_videos"
        )
      FROM "subscription_plans" AS p
      WHERE d."billing_plan_id" = p."id"
        AND p."quotas" IS NOT NULL
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_subscription_plans_is_custom"
    `);

    await queryRunner.query(`
      ALTER TABLE "subscription_plans"
      DROP CONSTRAINT IF EXISTS "FK_subscription_plans_target_dealership"
    `);

    await queryRunner.query(`
      ALTER TABLE "subscription_plans"
      DROP COLUMN IF EXISTS "target_dealership_id"
    `);

    await queryRunner.query(`
      ALTER TABLE "subscription_plans"
      DROP COLUMN IF EXISTS "is_custom"
    `);

    await queryRunner.query(`
      ALTER TABLE "subscription_plans"
      DROP COLUMN IF EXISTS "quotas"
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "subscription_plans"
      ADD COLUMN "quotas" jsonb NOT NULL DEFAULT '{"max_listings":3,"max_photos":6,"allow_videos":false}'::jsonb
    `);

    await queryRunner.query(`
      ALTER TABLE "subscription_plans"
      ADD COLUMN "is_custom" boolean NOT NULL DEFAULT false
    `);

    await queryRunner.query(`
      ALTER TABLE "subscription_plans"
      ADD COLUMN "target_dealership_id" uuid NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "subscription_plans"
      ADD CONSTRAINT "FK_subscription_plans_target_dealership"
      FOREIGN KEY ("target_dealership_id")
      REFERENCES "dealerships"("id")
      ON DELETE SET NULL
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_subscription_plans_is_custom"
      ON "subscription_plans" ("is_custom")
    `);

    await queryRunner.query(`
      UPDATE "subscription_plans" AS p
      SET "quotas" = jsonb_build_object(
        'max_listings', d."max_listings",
        'max_photos', d."max_photos",
        'allow_videos', d."allow_videos"
      )
      FROM "dealerships" AS d
      WHERE d."billing_plan_id" = p."id"
    `);

    await queryRunner.query(`
      ALTER TABLE "dealerships"
      DROP COLUMN IF EXISTS "allow_videos"
    `);

    await queryRunner.query(`
      ALTER TABLE "dealerships"
      DROP COLUMN IF EXISTS "max_photos"
    `);

    await queryRunner.query(`
      ALTER TABLE "dealerships"
      DROP COLUMN IF EXISTS "max_listings"
    `);
  }
}
