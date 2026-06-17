import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateAlertNotificationEvents1781800000002
  implements MigrationInterface
{
  name = "CreateAlertNotificationEvents1781800000002";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "alert_notification_event_type_enum" AS ENUM (
        'new_listing',
        'price_drop',
        'sold_removed',
        'featured',
        'recently_updated',
        'favorite_change',
        'new_message',
        'seller_reply',
        'saved_vehicle_reminder'
      )`,
    );
    await queryRunner.query(
      `CREATE TYPE "alert_notification_channel_enum" AS ENUM ('email', 'push', 'sms')`,
    );
    await queryRunner.query(
      `CREATE TYPE "alert_notification_event_status_enum" AS ENUM ('pending', 'sent', 'skipped')`,
    );
    await queryRunner.query(
      `CREATE TABLE "alert_notification_events" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "profile_id" uuid NOT NULL,
        "alert_id" uuid,
        "vehicle_id" uuid,
        "event_type" "alert_notification_event_type_enum" NOT NULL,
        "channel" "alert_notification_channel_enum" NOT NULL,
        "status" "alert_notification_event_status_enum" NOT NULL DEFAULT 'pending',
        "scheduled_for" TIMESTAMP,
        "sent_at" TIMESTAMP,
        "payload" jsonb NOT NULL DEFAULT '{}',
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_alert_notification_events_id" PRIMARY KEY ("id")
      )`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_alert_notification_events_profile_id" ON "alert_notification_events" ("profile_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_alert_notification_events_pending_digest" ON "alert_notification_events" ("status", "scheduled_for")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_alert_notification_events_dedup" ON "alert_notification_events" ("alert_id", "vehicle_id", "event_type") WHERE "alert_id" IS NOT NULL AND "vehicle_id" IS NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "alert_notification_events" ADD CONSTRAINT "FK_alert_notification_events_profile_id" FOREIGN KEY ("profile_id") REFERENCES "profile"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "alert_notification_events" ADD CONSTRAINT "FK_alert_notification_events_alert_id" FOREIGN KEY ("alert_id") REFERENCES "alerts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "alert_notification_events" DROP CONSTRAINT "FK_alert_notification_events_alert_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "alert_notification_events" DROP CONSTRAINT "FK_alert_notification_events_profile_id"`,
    );
    await queryRunner.query(`DROP INDEX "UQ_alert_notification_events_dedup"`);
    await queryRunner.query(
      `DROP INDEX "IDX_alert_notification_events_pending_digest"`,
    );
    await queryRunner.query(
      `DROP INDEX "IDX_alert_notification_events_profile_id"`,
    );
    await queryRunner.query(`DROP TABLE "alert_notification_events"`);
    await queryRunner.query(`DROP TYPE "alert_notification_event_status_enum"`);
    await queryRunner.query(`DROP TYPE "alert_notification_channel_enum"`);
    await queryRunner.query(`DROP TYPE "alert_notification_event_type_enum"`);
  }
}
