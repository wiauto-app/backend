import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateAlertNotificationPreferences1781800000000
  implements MigrationInterface
{
  name = "CreateAlertNotificationPreferences1781800000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "alert_notification_frequency_enum" AS ENUM ('instant', 'daily', 'weekly')`,
    );
    await queryRunner.query(
      `CREATE TABLE "alert_notification_preferences" (
        "profile_id" uuid NOT NULL,
        "notify_new_matches" boolean NOT NULL DEFAULT true,
        "notify_price_drops" boolean NOT NULL DEFAULT true,
        "notify_favorite_changes" boolean NOT NULL DEFAULT true,
        "notify_new_messages" boolean NOT NULL DEFAULT true,
        "notify_seller_replies" boolean NOT NULL DEFAULT true,
        "notify_saved_vehicle_reminders" boolean NOT NULL DEFAULT true,
        "saved_vehicle_reminder_days" integer NOT NULL DEFAULT 7,
        "frequency" "alert_notification_frequency_enum" NOT NULL DEFAULT 'instant',
        "channel_email" boolean NOT NULL DEFAULT true,
        "channel_push" boolean NOT NULL DEFAULT true,
        "channel_sms" boolean NOT NULL DEFAULT false,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_alert_notification_preferences_profile_id" PRIMARY KEY ("profile_id")
      )`,
    );
    await queryRunner.query(
      `ALTER TABLE "alert_notification_preferences" ADD CONSTRAINT "FK_alert_notification_preferences_profile_id" FOREIGN KEY ("profile_id") REFERENCES "profile"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "alert_notification_preferences" DROP CONSTRAINT "FK_alert_notification_preferences_profile_id"`,
    );
    await queryRunner.query(`DROP TABLE "alert_notification_preferences"`);
    await queryRunner.query(`DROP TYPE "alert_notification_frequency_enum"`);
  }
}
