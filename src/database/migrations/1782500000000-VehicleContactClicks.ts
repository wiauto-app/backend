import { MigrationInterface, QueryRunner } from "typeorm";

export class VehicleContactClicks1782500000000 implements MigrationInterface {
  name = "VehicleContactClicks1782500000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."vehicle_contact_click_type" AS ENUM ('phone', 'whatsapp');
      EXCEPTION
        WHEN duplicate_object THEN NULL;
      END $$;
    `);

    await queryRunner.query(`
      CREATE TABLE "vehicle_contact_clicks" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "vehicle_id" uuid NOT NULL,
        "profile_id" uuid NULL,
        "type" "public"."vehicle_contact_click_type" NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_vehicle_contact_clicks_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_vehicle_contact_clicks_vehicle_id"
      ON "vehicle_contact_clicks" ("vehicle_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_vehicle_contact_clicks_created_at"
      ON "vehicle_contact_clicks" ("created_at")
    `);

    await queryRunner.query(`
      ALTER TABLE "vehicle_contact_clicks"
      ADD CONSTRAINT "FK_vehicle_contact_clicks_vehicle_id"
      FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "vehicle_contact_clicks"
      ADD CONSTRAINT "FK_vehicle_contact_clicks_profile_id"
      FOREIGN KEY ("profile_id") REFERENCES "profile"("id")
      ON DELETE SET NULL ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "vehicle_contact_clicks" DROP CONSTRAINT "FK_vehicle_contact_clicks_profile_id"
    `);
    await queryRunner.query(`
      ALTER TABLE "vehicle_contact_clicks" DROP CONSTRAINT "FK_vehicle_contact_clicks_vehicle_id"
    `);
    await queryRunner.query(`DROP INDEX "public"."IDX_vehicle_contact_clicks_created_at"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_vehicle_contact_clicks_vehicle_id"`);
    await queryRunner.query(`DROP TABLE "vehicle_contact_clicks"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."vehicle_contact_click_type"`);
  }
}
