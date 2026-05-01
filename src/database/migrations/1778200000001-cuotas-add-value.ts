import { MigrationInterface, QueryRunner } from "typeorm";

export class CuotasAddValue1778200000001 implements MigrationInterface {
  name = "CuotasAddValue1778200000001";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "cuotas" ADD "value" integer NOT NULL DEFAULT 0`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "cuotas" DROP COLUMN "value"`);
  }
}
