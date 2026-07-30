import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveSavedVehicleReminder1785600000000
  implements MigrationInterface
{
  name = "RemoveSavedVehicleReminder1785600000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM "alert_notification_events"
      WHERE "event_type" = 'saved_vehicle_reminder'
    `);

    await queryRunner.query(`
      ALTER TABLE "alert_notification_preferences"
      DROP COLUMN IF EXISTS "notify_saved_vehicle_reminders"
    `);

    await queryRunner.query(`
      ALTER TABLE "alert_notification_preferences"
      DROP COLUMN IF EXISTS "saved_vehicle_reminder_days"
    `);

    await queryRunner.query(`
      ALTER TYPE "alert_notification_event_type_enum"
      RENAME TO "alert_notification_event_type_enum_old"
    `);

    await queryRunner.query(`
      CREATE TYPE "alert_notification_event_type_enum" AS ENUM (
        'new_listing',
        'price_drop',
        'sold_removed',
        'featured',
        'recently_updated',
        'favorite_change',
        'new_message',
        'seller_reply'
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "alert_notification_events"
      ALTER COLUMN "event_type"
      TYPE "alert_notification_event_type_enum"
      USING "event_type"::text::"alert_notification_event_type_enum"
    `);

    await queryRunner.query(`
      DROP TYPE "alert_notification_event_type_enum_old"
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TYPE "alert_notification_event_type_enum"
      RENAME TO "alert_notification_event_type_enum_old"
    `);

    await queryRunner.query(`
      CREATE TYPE "alert_notification_event_type_enum" AS ENUM (
        'new_listing',
        'price_drop',
        'sold_removed',
        'featured',
        'recently_updated',
        'favorite_change',
        'new_message',
        'seller_reply',
        'saved_vehicle_reminder'
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "alert_notification_events"
      ALTER COLUMN "event_type"
      TYPE "alert_notification_event_type_enum"
      USING "event_type"::text::"alert_notification_event_type_enum"
    `);

    await queryRunner.query(`
      DROP TYPE "alert_notification_event_type_enum_old"
    `);

    await queryRunner.query(`
      ALTER TABLE "alert_notification_preferences"
      ADD COLUMN IF NOT EXISTS "notify_saved_vehicle_reminders" boolean NOT NULL DEFAULT true
    `);

    await queryRunner.query(`
      ALTER TABLE "alert_notification_preferences"
      ADD COLUMN IF NOT EXISTS "saved_vehicle_reminder_days" integer NOT NULL DEFAULT 7
    `);
  }
}
