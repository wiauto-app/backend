import { MigrationInterface, QueryRunner } from "typeorm";

export class DropVehiclesTitle1781200000000 implements MigrationInterface {
  name = "DropVehiclesTitle1781200000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "vehicles" DROP COLUMN "title"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "vehicles" ADD "title" character varying NOT NULL DEFAULT ''`,
    );
    await queryRunner.query(`ALTER TABLE "vehicles" ALTER COLUMN "title" DROP DEFAULT`);
  }
}
