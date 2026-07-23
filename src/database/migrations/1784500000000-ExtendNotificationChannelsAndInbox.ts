import { MigrationInterface, QueryRunner } from "typeorm";

export class ExtendNotificationChannelsAndInbox1784500000000
  implements MigrationInterface
{
  name = "ExtendNotificationChannelsAndInbox1784500000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "alert_notification_preferences" ADD "channel_in_app" boolean NOT NULL DEFAULT true`,
    );
    await queryRunner.query(
      `ALTER TABLE "alert_notification_preferences" ADD "channel_whatsapp" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "alert_notification_preferences" ADD "notify_new_leads" boolean NOT NULL DEFAULT true`,
    );

    await queryRunner.query(
      `CREATE TABLE "notifications" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "profile_id" uuid NOT NULL,
        "category" character varying NOT NULL,
        "title" character varying NOT NULL,
        "body" text NOT NULL,
        "data" jsonb,
        "read_at" TIMESTAMP WITH TIME ZONE,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_notifications_id" PRIMARY KEY ("id")
      )`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_notifications_profile_id_created_at" ON "notifications" ("profile_id", "created_at" DESC)`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_notifications_profile_id_read_at" ON "notifications" ("profile_id", "read_at")`,
    );
    await queryRunner.query(
      `ALTER TABLE "notifications" ADD CONSTRAINT "FK_notifications_profile_id" FOREIGN KEY ("profile_id") REFERENCES "profile"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "notifications" DROP CONSTRAINT "FK_notifications_profile_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "IDX_notifications_profile_id_read_at"`,
    );
    await queryRunner.query(
      `DROP INDEX "IDX_notifications_profile_id_created_at"`,
    );
    await queryRunner.query(`DROP TABLE "notifications"`);

    await queryRunner.query(
      `ALTER TABLE "alert_notification_preferences" DROP COLUMN "notify_new_leads"`,
    );
    await queryRunner.query(
      `ALTER TABLE "alert_notification_preferences" DROP COLUMN "channel_whatsapp"`,
    );
    await queryRunner.query(
      `ALTER TABLE "alert_notification_preferences" DROP COLUMN "channel_in_app"`,
    );
  }
}
