import { MigrationInterface, QueryRunner } from "typeorm";

export class DropVehicleReviews1787100000000 implements MigrationInterface {
  name = "DropVehicleReviews1787100000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "reviews" CASCADE`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_vehicles_rating"`);
    await queryRunner.query(
      `ALTER TABLE "vehicles" DROP COLUMN IF EXISTS "rating"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "vehicles"
      ADD COLUMN IF NOT EXISTS "rating" numeric(2,1) NULL
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_vehicles_rating"
      ON "vehicles" ("rating")
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "reviews" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "rating" integer NOT NULL,
        "comment" character varying NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "profile_id" uuid NOT NULL,
        "vehicle_id" uuid NOT NULL,
        CONSTRAINT "PK_231ae565c273ee700b283f15c1d" PRIMARY KEY ("id"),
        CONSTRAINT "FK_fe61806a8ae342e628aaa93ac47"
          FOREIGN KEY ("profile_id") REFERENCES "profile"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_d2d7bf64c4e8f73674a86466c48"
          FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE CASCADE
      )
    `);
  }
}
