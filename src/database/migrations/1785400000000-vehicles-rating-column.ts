import { MigrationInterface, QueryRunner } from "typeorm";

export class VehiclesRatingColumn1785400000000 implements MigrationInterface {
  name = "VehiclesRatingColumn1785400000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "vehicles"
      ADD COLUMN IF NOT EXISTS "rating" numeric(2,1) NULL
    `);

    await queryRunner.query(`
      UPDATE "vehicles" v
      SET "rating" = sub.avg_rating
      FROM (
        SELECT
          r.vehicle_id,
          ROUND(AVG(r.rating)::numeric, 1) AS avg_rating
        FROM "reviews" r
        GROUP BY r.vehicle_id
      ) sub
      WHERE v.id = sub.vehicle_id
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_vehicles_rating"
      ON "vehicles" ("rating")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_vehicles_rating"
    `);
    await queryRunner.query(`
      ALTER TABLE "vehicles" DROP COLUMN IF EXISTS "rating"
    `);
  }
}
