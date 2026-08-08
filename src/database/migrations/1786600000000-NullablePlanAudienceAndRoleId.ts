import { MigrationInterface, QueryRunner } from "typeorm";

export class NullablePlanAudienceAndRoleId1786600000000
  implements MigrationInterface
{
  name = "NullablePlanAudienceAndRoleId1786600000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "subscription_plans" ALTER COLUMN "audience" DROP NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `UPDATE "subscription_plans" SET "audience" = 'dealership' WHERE "audience" IS NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscription_plans" ALTER COLUMN "audience" SET NOT NULL`,
    );
  }
}
