import { MigrationInterface, QueryRunner } from "typeorm";

export class PlanQuotasCustomDealership1785800000000
  implements MigrationInterface
{
  name = "PlanQuotasCustomDealership1785800000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
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
      ALTER TABLE "dealerships"
      ADD COLUMN "billing_plan_id" uuid NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "dealerships"
      ADD CONSTRAINT "FK_dealerships_billing_plan"
      FOREIGN KEY ("billing_plan_id")
      REFERENCES "subscription_plans"("id")
      ON DELETE SET NULL
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_subscription_plans_is_custom"
      ON "subscription_plans" ("is_custom")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_dealerships_billing_plan_id"
      ON "dealerships" ("billing_plan_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_dealerships_billing_plan_id"
    `);
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_subscription_plans_is_custom"
    `);
    await queryRunner.query(`
      ALTER TABLE "dealerships"
      DROP CONSTRAINT IF EXISTS "FK_dealerships_billing_plan"
    `);
    await queryRunner.query(`
      ALTER TABLE "dealerships"
      DROP COLUMN IF EXISTS "billing_plan_id"
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
}
