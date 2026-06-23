import { MigrationInterface, QueryRunner } from "typeorm";

export class DealershipShowPhone1781978817951 implements MigrationInterface {
  name = "DealershipShowPhone1781978817951";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "dealerships" ADD "show_phone" boolean NOT NULL DEFAULT true`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "dealerships" DROP COLUMN "show_phone"`);
  }
}
