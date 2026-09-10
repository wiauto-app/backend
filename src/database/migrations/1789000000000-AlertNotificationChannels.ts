import { MigrationInterface, QueryRunner } from "typeorm";

export class AlertNotificationChannels1789000000000
  implements MigrationInterface
{
  name = "AlertNotificationChannels1789000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "alerts" ADD "notification_channels" jsonb NOT NULL DEFAULT '["email","in_app"]'`,
    );

    // Preserve current behaviour: each existing saved search receives a
    // snapshot of the profile's former global channels.
    await queryRunner.query(`
      UPDATE "alerts" AS alert
      SET "notification_channels" = to_jsonb(
        array_remove(
          ARRAY[
            CASE WHEN preferences."channel_email" THEN 'email' END,
            CASE WHEN preferences."channel_push" THEN 'push' END,
            CASE WHEN preferences."channel_sms" THEN 'sms' END,
            CASE WHEN preferences."channel_in_app" THEN 'in_app' END,
            CASE WHEN preferences."channel_whatsapp" THEN 'whatsapp' END
          ],
          NULL
        )
      )
      FROM "alert_notification_preferences" AS preferences
      WHERE alert."profile_id" = preferences."profile_id"
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "alerts" DROP COLUMN "notification_channels"`,
    );
  }
}
