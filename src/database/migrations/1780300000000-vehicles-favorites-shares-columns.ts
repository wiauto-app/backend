import { MigrationInterface, QueryRunner } from "typeorm";

export class VehiclesFavoritesSharesColumns1780300000000 implements MigrationInterface {
  name = "VehiclesFavoritesSharesColumns1780300000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "vehicles"
      ADD COLUMN IF NOT EXISTS "favorites" integer NOT NULL DEFAULT 0
    `);
    await queryRunner.query(`
      ALTER TABLE "vehicles"
      ADD COLUMN IF NOT EXISTS "shares" integer NOT NULL DEFAULT 0
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "vehicles" DROP COLUMN IF EXISTS "shares"
    `);
    await queryRunner.query(`
      ALTER TABLE "vehicles" DROP COLUMN IF EXISTS "favorites"
    `);
  }
}
