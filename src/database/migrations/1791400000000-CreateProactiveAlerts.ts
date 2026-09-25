import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateProactiveAlerts1791400000000 implements MigrationInterface {
  name = "CreateProactiveAlerts1791400000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "proactive_alert_settings" (
        "profile_id" uuid NOT NULL,
        "enabled_types" jsonb NOT NULL DEFAULT '[]',
        CONSTRAINT "PK_proactive_alert_settings" PRIMARY KEY ("profile_id"),
        CONSTRAINT "FK_proactive_alert_settings_profile"
          FOREIGN KEY ("profile_id") REFERENCES "profile"("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "proactive_alert_log" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "profile_id" uuid NOT NULL,
        "vehicle_id" uuid,
        "type" character varying(64) NOT NULL,
        "dedupe_key" character varying(256) NOT NULL,
        "sent_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_proactive_alert_log" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_proactive_alert_log_dedupe" UNIQUE ("dedupe_key")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_proactive_alert_log_profile_type"
        ON "proactive_alert_log" ("profile_id", "type")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_proactive_alert_log_profile_type"`);
    await queryRunner.query(`DROP TABLE "proactive_alert_log"`);
    await queryRunner.query(`DROP TABLE "proactive_alert_settings"`);
  }
}
