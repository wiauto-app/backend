import { MigrationInterface, QueryRunner } from "typeorm";

export class DealershipSchedules1784300000000 implements MigrationInterface {
  name = "DealershipSchedules1784300000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "dealership_schedules" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "dealership_id" uuid NOT NULL,
        "day" smallint NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_dealership_schedules" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_dealership_schedules_dealership_day" UNIQUE ("dealership_id", "day"),
        CONSTRAINT "FK_dealership_schedules_dealership"
          FOREIGN KEY ("dealership_id") REFERENCES "dealerships"("id")
          ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "dealership_open_times" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "schedule_id" uuid NOT NULL,
        "open_time" TIME NOT NULL,
        "close_time" TIME NOT NULL,
        CONSTRAINT "PK_dealership_open_times" PRIMARY KEY ("id"),
        CONSTRAINT "FK_dealership_open_times_schedule"
          FOREIGN KEY ("schedule_id") REFERENCES "dealership_schedules"("id")
          ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_dealership_schedules_dealership_id"
      ON "dealership_schedules" ("dealership_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_dealership_open_times_schedule_id"
      ON "dealership_open_times" ("schedule_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_dealership_open_times_schedule_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_dealership_schedules_dealership_id"`,
    );
    await queryRunner.query(`DROP TABLE "dealership_open_times"`);
    await queryRunner.query(`DROP TABLE "dealership_schedules"`);
  }
}
