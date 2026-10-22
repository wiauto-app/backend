import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateVehicleDrafts1792703088648 implements MigrationInterface {
  name = "CreateVehicleDrafts1792703088648";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "vehicle_drafts" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "profile_id" uuid NOT NULL,
        "values" jsonb NOT NULL,
        "step" integer,
        "appraisal_id" uuid,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_5d06be0f78bd4c9097fd35001ee" UNIQUE ("profile_id"),
        CONSTRAINT "PK_c4c8b819b6e0195e1a8664e90db" PRIMARY KEY ("id")
      )
    `);

    // La tabla puede existir de un intento anterior (p. ej. migración manual): IF NOT EXISTS en FK.
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_constraint
          WHERE conname = 'FK_vehicle_drafts_profile_id'
        ) THEN
          ALTER TABLE "vehicle_drafts"
          ADD CONSTRAINT "FK_vehicle_drafts_profile_id"
          FOREIGN KEY ("profile_id") REFERENCES "profile"("id")
          ON DELETE CASCADE ON UPDATE NO ACTION;
        END IF;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE IF EXISTS "vehicle_drafts"
      DROP CONSTRAINT IF EXISTS "FK_vehicle_drafts_profile_id"
    `);
    await queryRunner.query(`DROP TABLE IF EXISTS "vehicle_drafts"`);
  }
}
