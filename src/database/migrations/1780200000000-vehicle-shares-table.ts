import { MigrationInterface, QueryRunner } from "typeorm";

export class VehicleSharesTable1780200000000 implements MigrationInterface {
  name = "VehicleSharesTable1780200000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "vehicle_shares" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "vehicle_id" uuid NOT NULL,
        "profile_id" uuid NULL,
        "platform" character varying NOT NULL,
        "source" character varying NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_vehicle_shares_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_vehicle_shares_vehicle_id" ON "vehicle_shares" ("vehicle_id")
    `);
    await queryRunner.query(`
      ALTER TABLE "vehicle_shares"
      ADD CONSTRAINT "FK_vehicle_shares_vehicle_id"
      FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "vehicle_shares"
      ADD CONSTRAINT "FK_vehicle_shares_profile_id"
      FOREIGN KEY ("profile_id") REFERENCES "profile"("id")
      ON DELETE SET NULL ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "vehicle_shares" DROP CONSTRAINT "FK_vehicle_shares_profile_id"
    `);
    await queryRunner.query(`
      ALTER TABLE "vehicle_shares" DROP CONSTRAINT "FK_vehicle_shares_vehicle_id"
    `);
    await queryRunner.query(`DROP INDEX "public"."IDX_vehicle_shares_vehicle_id"`);
    await queryRunner.query(`DROP TABLE "vehicle_shares"`);
  }
}
