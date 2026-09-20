import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSubscriptionPlanIsVisible1789924337042 implements MigrationInterface {
  name = "AddSubscriptionPlanIsVisible1789924337042";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "subscription_plans" ADD "is_visible" boolean NOT NULL DEFAULT true`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "subscription_plans" DROP COLUMN "is_visible"`,
    );
  }
}
