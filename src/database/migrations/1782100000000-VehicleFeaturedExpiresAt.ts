import { MigrationInterface, QueryRunner } from "typeorm";

export class VehicleFeaturedExpiresAt1782100000000 implements MigrationInterface {
  name = "VehicleFeaturedExpiresAt1782100000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "vehicles" ADD "featured_expires_at" TIMESTAMP`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "vehicles" DROP COLUMN "featured_expires_at"`,
    );
  }
}
