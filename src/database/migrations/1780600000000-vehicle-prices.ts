import { MigrationInterface, QueryRunner } from "typeorm";

export class VehiclePrices1780600000000 implements MigrationInterface {
  name = "VehiclePrices1780600000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "vehicle_price_status" AS ENUM ('active', 'inactive')`,
    );
    await queryRunner.query(`
      CREATE TABLE "vehicle_prices" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "price" integer NOT NULL,
        "status" "vehicle_price_status" NOT NULL DEFAULT 'active',
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "vehicle_id" uuid NOT NULL,
        CONSTRAINT "PK_vehicle_prices" PRIMARY KEY ("id"),
        CONSTRAINT "FK_vehicle_prices_vehicle_id" FOREIGN KEY ("vehicle_id")
          REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);
    await queryRunner.query(`
      INSERT INTO "vehicle_prices" ("id", "price", "status", "vehicle_id", "created_at")
      SELECT gen_random_uuid(), "price", 'active', "id", "created_at"
      FROM "vehicles"
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_vehicle_prices_one_active_per_vehicle"
      ON "vehicle_prices" ("vehicle_id")
      WHERE "status" = 'active'
    `);
    await queryRunner.query(`ALTER TABLE "vehicles" DROP COLUMN "price"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "vehicles" ADD COLUMN "price" integer NOT NULL DEFAULT 0
    `);
    await queryRunner.query(`
      UPDATE "vehicles" v
      SET "price" = vp."price"
      FROM "vehicle_prices" vp
      WHERE vp."vehicle_id" = v."id" AND vp."status" = 'active'
    `);
    await queryRunner.query(
      `DROP INDEX "public"."UQ_vehicle_prices_one_active_per_vehicle"`,
    );
    await queryRunner.query(`DROP TABLE "vehicle_prices"`);
    await queryRunner.query(`DROP TYPE "vehicle_price_status"`);
  }
}
