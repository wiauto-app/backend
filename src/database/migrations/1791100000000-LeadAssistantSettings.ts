import { MigrationInterface, QueryRunner } from "typeorm";

export class LeadAssistantSettings1791100000000 implements MigrationInterface {
  name = "LeadAssistantSettings1791100000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "lead_assistant_settings" (
        "profile_id" uuid NOT NULL,
        "enabled" boolean NOT NULL DEFAULT false,
        "context_note" character varying(500) NOT NULL DEFAULT '',
        "objective" character varying(32) NOT NULL DEFAULT 'anyone',
        "persuasion" character varying(32) NOT NULL DEFAULT 'balanced',
        "extension" character varying(32) NOT NULL DEFAULT 'medium',
        "tone" character varying(32) NOT NULL DEFAULT 'professional',
        "reply_delay_seconds" integer NOT NULL DEFAULT 30,
        "notify_on_reply" boolean NOT NULL DEFAULT true,
        "notify_on_quota_exhausted" boolean NOT NULL DEFAULT true,
        "notify_on_hot_lead" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_lead_assistant_settings" PRIMARY KEY ("profile_id"),
        CONSTRAINT "FK_lead_assistant_settings_profile"
          FOREIGN KEY ("profile_id") REFERENCES "profile"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "lead_assistant_quota_notices" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "profile_id" uuid NOT NULL,
        "chat_id" uuid NOT NULL,
        "period_start" TIMESTAMP WITH TIME ZONE NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_lead_assistant_quota_notices" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_lead_assistant_quota_notice_period"
          UNIQUE ("profile_id", "chat_id", "period_start")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_lead_assistant_quota_notices_profile"
        ON "lead_assistant_quota_notices" ("profile_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "lead_assistant_quota_notices"`);
    await queryRunner.query(`DROP TABLE "lead_assistant_settings"`);
  }
}
