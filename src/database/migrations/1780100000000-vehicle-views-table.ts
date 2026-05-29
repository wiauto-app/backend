import { MigrationInterface, QueryRunner } from "typeorm";

export class VehicleViewsTable1780100000000 implements MigrationInterface {
  name = "VehicleViewsTable1780100000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "vehicle_views" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "vehicle_id" uuid NOT NULL,
        "profile_id" uuid NULL,
        "ip_hash" character varying NULL,
        "user_agent" character varying NULL,
        "referer" character varying NULL,
        "metadata" jsonb NOT NULL DEFAULT '{}',
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_vehicle_views_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_vehicle_views_vehicle_id" ON "vehicle_views" ("vehicle_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_vehicle_views_created_at" ON "vehicle_views" ("created_at")
    `);
    await queryRunner.query(`
      ALTER TABLE "vehicle_views"
      ADD CONSTRAINT "FK_vehicle_views_vehicle_id"
      FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "vehicle_views"
      ADD CONSTRAINT "FK_vehicle_views_profile_id"
      FOREIGN KEY ("profile_id") REFERENCES "profile"("id")
      ON DELETE SET NULL ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "vehicle_views" DROP CONSTRAINT "FK_vehicle_views_profile_id"
    `);
    await queryRunner.query(`
      ALTER TABLE "vehicle_views" DROP CONSTRAINT "FK_vehicle_views_vehicle_id"
    `);
    await queryRunner.query(`DROP INDEX "public"."IDX_vehicle_views_created_at"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_vehicle_views_vehicle_id"`);
    await queryRunner.query(`DROP TABLE "vehicle_views"`);
  }
}
