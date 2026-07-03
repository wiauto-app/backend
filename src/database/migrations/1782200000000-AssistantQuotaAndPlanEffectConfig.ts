import { MigrationInterface, QueryRunner } from "typeorm";

export class AssistantQuotaAndPlanEffectConfig1782200000000 implements MigrationInterface {
  name = "AssistantQuotaAndPlanEffectConfig1782200000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "profile" ADD "assistant_purchased_credits" integer NOT NULL DEFAULT 0`,
    );
    await queryRunner.query(
      `ALTER TABLE "profile" ADD "assistant_monthly_free_used" integer NOT NULL DEFAULT 0`,
    );
    await queryRunner.query(
      `ALTER TABLE "profile" ADD "assistant_quota_period_start" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscription_plans" ADD "effect_config" jsonb NOT NULL DEFAULT '{}'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "subscription_plans" DROP COLUMN "effect_config"`,
    );
    await queryRunner.query(
      `ALTER TABLE "profile" DROP COLUMN "assistant_quota_period_start"`,
    );
    await queryRunner.query(
      `ALTER TABLE "profile" DROP COLUMN "assistant_monthly_free_used"`,
    );
    await queryRunner.query(
      `ALTER TABLE "profile" DROP COLUMN "assistant_purchased_credits"`,
    );
  }
}
