import { MigrationInterface, QueryRunner } from "typeorm";

export class VehicleScheduledRenew1781500000000 implements MigrationInterface {
  name = "VehicleScheduledRenew1781500000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "vehicles" ADD "scheduled_publish_at" TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "vehicles" ADD "renewed_at" TIMESTAMP`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "vehicles" DROP COLUMN "renewed_at"`);
    await queryRunner.query(
      `ALTER TABLE "vehicles" DROP COLUMN "scheduled_publish_at"`,
    );
  }
}
