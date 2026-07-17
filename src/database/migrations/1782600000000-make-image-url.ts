import { MigrationInterface, QueryRunner } from "typeorm";

export class MakeImageUrl1782600000000 implements MigrationInterface {
  name = "MakeImageUrl1782600000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "make" ADD "image_url" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "make" DROP COLUMN "image_url"`);
  }
}
