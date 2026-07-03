import { MigrationInterface, QueryRunner } from "typeorm";

export class VehiclePhoneFlags1782300000000 implements MigrationInterface {
  name = "VehiclePhoneFlags1782300000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "vehicles" ADD "has_whatsapp" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "vehicles" ADD "show_phone" boolean NOT NULL DEFAULT true`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "vehicles" DROP COLUMN "show_phone"`);
    await queryRunner.query(`ALTER TABLE "vehicles" DROP COLUMN "has_whatsapp"`);
  }
}
