import { MigrationInterface, QueryRunner } from "typeorm";

export class DropSubscriptionPlanSlug1785900000000
  implements MigrationInterface
{
  name = "DropSubscriptionPlanSlug1785900000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "subscription_plans"
      DROP CONSTRAINT IF EXISTS "UQ_subscription_plans_slug"
    `);

    await queryRunner.query(`
      ALTER TABLE "subscription_plans"
      DROP COLUMN IF EXISTS "slug"
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "subscription_plans"
      ADD COLUMN "slug" character varying NOT NULL DEFAULT ''
    `);

    await queryRunner.query(`
      UPDATE "subscription_plans"
      SET "slug" = "id"::text
      WHERE "slug" = ''
    `);

    await queryRunner.query(`
      ALTER TABLE "subscription_plans"
      ALTER COLUMN "slug" DROP DEFAULT
    `);

    await queryRunner.query(`
      ALTER TABLE "subscription_plans"
      ADD CONSTRAINT "UQ_subscription_plans_slug" UNIQUE ("slug")
    `);
  }
}
