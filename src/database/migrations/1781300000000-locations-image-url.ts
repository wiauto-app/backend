import { MigrationInterface, QueryRunner } from "typeorm";

export class LocationsImageUrl1781300000000 implements MigrationInterface {
  name = "LocationsImageUrl1781300000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "provinces" ADD "image_url" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "communities" ADD "image_url" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "municipalities" ADD "image_url" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "municipalities" DROP COLUMN "image_url"`);
    await queryRunner.query(`ALTER TABLE "communities" DROP COLUMN "image_url"`);
    await queryRunner.query(`ALTER TABLE "provinces" DROP COLUMN "image_url"`);
  }
}
