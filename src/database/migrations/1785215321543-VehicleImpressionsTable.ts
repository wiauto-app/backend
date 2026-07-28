import { MigrationInterface, QueryRunner } from "typeorm";

export class VehicleImpressionsTable1785215321543 implements MigrationInterface {
  name = "VehicleImpressionsTable1785215321543";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "vehicle_impressions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "vehicle_id" uuid NOT NULL,
        "profile_id" uuid NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_vehicle_impressions_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_vehicle_impressions_vehicle_id" ON "vehicle_impressions" ("vehicle_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_vehicle_impressions_created_at" ON "vehicle_impressions" ("created_at")
    `);
    await queryRunner.query(`
      ALTER TABLE "vehicle_impressions"
      ADD CONSTRAINT "FK_vehicle_impressions_vehicle_id"
      FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "vehicle_impressions"
      ADD CONSTRAINT "FK_vehicle_impressions_profile_id"
      FOREIGN KEY ("profile_id") REFERENCES "profile"("id")
      ON DELETE SET NULL ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "vehicle_impressions" DROP CONSTRAINT "FK_vehicle_impressions_profile_id"
    `);
    await queryRunner.query(`
      ALTER TABLE "vehicle_impressions" DROP CONSTRAINT "FK_vehicle_impressions_vehicle_id"
    `);
    await queryRunner.query(`DROP INDEX "public"."IDX_vehicle_impressions_created_at"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_vehicle_impressions_vehicle_id"`);
    await queryRunner.query(`DROP TABLE "vehicle_impressions"`);
  }
}
