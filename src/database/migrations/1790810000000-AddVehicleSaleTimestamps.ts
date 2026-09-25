import { MigrationInterface, QueryRunner } from "typeorm";

export class AddVehicleSaleTimestamps1790810000000 implements MigrationInterface {
  name = "AddVehicleSaleTimestamps1790810000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "vehicles" ADD COLUMN IF NOT EXISTS "status_changed_at" TIMESTAMP WITH TIME ZONE NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "vehicles" ADD COLUMN IF NOT EXISTS "sold_at" TIMESTAMP WITH TIME ZONE NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "vehicles" DROP COLUMN IF EXISTS "sold_at"`);
    await queryRunner.query(
      `ALTER TABLE "vehicles" DROP COLUMN IF EXISTS "status_changed_at"`,
    );
  }
}
