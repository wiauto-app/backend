import { MigrationInterface, QueryRunner } from "typeorm";

import { upsertFeatureCatalog } from "../../contexts/vehicles/catalog/features/upsert-feature-catalog";

export class AddFeatureCategory1789482046102 implements MigrationInterface {
  name = "AddFeatureCategory1789482046102";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "features" ADD "category" character varying(64) NOT NULL DEFAULT 'otros'`,
    );
    await upsertFeatureCatalog(queryRunner);
    await queryRunner.query(
      `ALTER TABLE "features" ALTER COLUMN "category" DROP DEFAULT`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "features" DROP COLUMN "category"`);
  }
}
