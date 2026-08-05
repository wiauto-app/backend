import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateVehicleEngagementTables1786300000000
  implements MigrationInterface
{
  name = "CreateVehicleEngagementTables1786300000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "vehicle_price_watches" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "profile_id" uuid NOT NULL,
        "vehicle_id" uuid NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_vehicle_price_watches_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_vehicle_price_watches_profile_vehicle" UNIQUE ("profile_id", "vehicle_id")
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_vehicle_price_watches_profile_id"
      ON "vehicle_price_watches" ("profile_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_vehicle_price_watches_vehicle_id"
      ON "vehicle_price_watches" ("vehicle_id")
    `);
    await queryRunner.query(`
      ALTER TABLE "vehicle_price_watches"
      ADD CONSTRAINT "FK_vehicle_price_watches_profile_id"
      FOREIGN KEY ("profile_id") REFERENCES "profile"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "vehicle_price_watches"
      ADD CONSTRAINT "FK_vehicle_price_watches_vehicle_id"
      FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      CREATE TABLE "dismissed_vehicles" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "profile_id" uuid NOT NULL,
        "vehicle_id" uuid NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_dismissed_vehicles_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_dismissed_vehicles_profile_vehicle" UNIQUE ("profile_id", "vehicle_id")
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_dismissed_vehicles_profile_id"
      ON "dismissed_vehicles" ("profile_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_dismissed_vehicles_vehicle_id"
      ON "dismissed_vehicles" ("vehicle_id")
    `);
    await queryRunner.query(`
      ALTER TABLE "dismissed_vehicles"
      ADD CONSTRAINT "FK_dismissed_vehicles_profile_id"
      FOREIGN KEY ("profile_id") REFERENCES "profile"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "dismissed_vehicles"
      ADD CONSTRAINT "FK_dismissed_vehicles_vehicle_id"
      FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "dismissed_vehicles"
      DROP CONSTRAINT "FK_dismissed_vehicles_vehicle_id"
    `);
    await queryRunner.query(`
      ALTER TABLE "dismissed_vehicles"
      DROP CONSTRAINT "FK_dismissed_vehicles_profile_id"
    `);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_dismissed_vehicles_vehicle_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_dismissed_vehicles_profile_id"`,
    );
    await queryRunner.query(`DROP TABLE "dismissed_vehicles"`);

    await queryRunner.query(`
      ALTER TABLE "vehicle_price_watches"
      DROP CONSTRAINT "FK_vehicle_price_watches_vehicle_id"
    `);
    await queryRunner.query(`
      ALTER TABLE "vehicle_price_watches"
      DROP CONSTRAINT "FK_vehicle_price_watches_profile_id"
    `);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_vehicle_price_watches_vehicle_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_vehicle_price_watches_profile_id"`,
    );
    await queryRunner.query(`DROP TABLE "vehicle_price_watches"`);
  }
}
