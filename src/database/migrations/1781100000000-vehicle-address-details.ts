import { MigrationInterface, QueryRunner } from "typeorm";

export class VehicleAddressDetails1781100000000 implements MigrationInterface {
  name = "VehicleAddressDetails1781100000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "vehicles" ADD COLUMN IF NOT EXISTS "address" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "vehicles" ADD COLUMN IF NOT EXISTS "address_details" jsonb`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "vehicles" DROP COLUMN IF EXISTS "address_details"`,
    );
    await queryRunner.query(
      `ALTER TABLE "vehicles" DROP COLUMN IF EXISTS "address"`,
    );
  }
}
