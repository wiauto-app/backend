import { MigrationInterface, QueryRunner } from "typeorm";

export class VehicleListsTables1780300000001 implements MigrationInterface {
  name = "VehicleListsTables1780300000001";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "vehicle_lists" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "profile_id" uuid NOT NULL,
        "is_default" boolean NOT NULL DEFAULT false,
        "name" character varying NOT NULL,
        "description" character varying NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_vehicle_lists_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_vehicle_lists_profile_id" ON "vehicle_lists" ("profile_id")
    `);
    await queryRunner.query(`
      ALTER TABLE "vehicle_lists"
      ADD CONSTRAINT "FK_vehicle_lists_profile_id"
      FOREIGN KEY ("profile_id") REFERENCES "profile"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      CREATE TABLE "vehicle_list_items" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "vehicle_list_id" uuid NOT NULL,
        "vehicle_id" uuid NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_vehicle_list_items_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_vehicle_list_items_list_vehicle" UNIQUE ("vehicle_list_id", "vehicle_id")
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_vehicle_list_items_vehicle_list_id" ON "vehicle_list_items" ("vehicle_list_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_vehicle_list_items_vehicle_id" ON "vehicle_list_items" ("vehicle_id")
    `);
    await queryRunner.query(`
      ALTER TABLE "vehicle_list_items"
      ADD CONSTRAINT "FK_vehicle_list_items_vehicle_list_id"
      FOREIGN KEY ("vehicle_list_id") REFERENCES "vehicle_lists"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "vehicle_list_items"
      ADD CONSTRAINT "FK_vehicle_list_items_vehicle_id"
      FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "vehicle_list_items" DROP CONSTRAINT "FK_vehicle_list_items_vehicle_id"
    `);
    await queryRunner.query(`
      ALTER TABLE "vehicle_list_items" DROP CONSTRAINT "FK_vehicle_list_items_vehicle_list_id"
    `);
    await queryRunner.query(`DROP INDEX "public"."IDX_vehicle_list_items_vehicle_id"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_vehicle_list_items_vehicle_list_id"`);
    await queryRunner.query(`DROP TABLE "vehicle_list_items"`);
    await queryRunner.query(`
      ALTER TABLE "vehicle_lists" DROP CONSTRAINT "FK_vehicle_lists_profile_id"
    `);
    await queryRunner.query(`DROP INDEX "public"."IDX_vehicle_lists_profile_id"`);
    await queryRunner.query(`DROP TABLE "vehicle_lists"`);
  }
}
