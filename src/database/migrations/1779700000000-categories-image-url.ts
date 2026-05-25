import { MigrationInterface, QueryRunner } from "typeorm";

export class CategoriesImageUrl1779700000000 implements MigrationInterface {
  name = "CategoriesImageUrl1779700000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "categories" ADD "image_url" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "categories" DROP COLUMN "image_url"`);
  }
}
