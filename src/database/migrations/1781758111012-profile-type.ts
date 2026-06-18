import { MigrationInterface, QueryRunner } from "typeorm";

export class ProfileType1781758111012 implements MigrationInterface {
    name = 'ProfileType1781758111012'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "alert_notification_preferences" DROP CONSTRAINT "FK_alert_notification_preferences_profile_id"`);
        await queryRunner.query(`ALTER TABLE "alert_notification_events" DROP CONSTRAINT "FK_alert_notification_events_alert_id"`);
        await queryRunner.query(`ALTER TABLE "alert_notification_events" DROP CONSTRAINT "FK_alert_notification_events_profile_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_alert_notification_events_profile_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_alert_notification_events_pending_digest"`);
        await queryRunner.query(`DROP INDEX "public"."UQ_alert_notification_events_dedup"`);
        await queryRunner.query(`CREATE TYPE "public"."profile_type_enum" AS ENUM('professional', 'particular')`);
        await queryRunner.query(`ALTER TABLE "profile" ADD "type" "public"."profile_type_enum" NOT NULL DEFAULT 'particular'`);
        await queryRunner.query(`ALTER TYPE "public"."alert_notification_frequency_enum" RENAME TO "alert_notification_frequency_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."alert_notification_preferences_frequency_enum" AS ENUM('instant', 'daily', 'weekly')`);
        await queryRunner.query(`ALTER TABLE "alert_notification_preferences" ALTER COLUMN "frequency" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "alert_notification_preferences" ALTER COLUMN "frequency" TYPE "public"."alert_notification_preferences_frequency_enum" USING "frequency"::"text"::"public"."alert_notification_preferences_frequency_enum"`);
        await queryRunner.query(`ALTER TABLE "alert_notification_preferences" ALTER COLUMN "frequency" SET DEFAULT 'instant'`);
        await queryRunner.query(`DROP TYPE "public"."alert_notification_frequency_enum_old"`);
        await queryRunner.query(`ALTER TYPE "public"."alert_notification_event_type_enum" RENAME TO "alert_notification_event_type_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."alert_notification_events_event_type_enum" AS ENUM('new_listing', 'price_drop', 'sold_removed', 'featured', 'recently_updated', 'favorite_change', 'new_message', 'seller_reply', 'saved_vehicle_reminder')`);
        await queryRunner.query(`ALTER TABLE "alert_notification_events" ALTER COLUMN "event_type" TYPE "public"."alert_notification_events_event_type_enum" USING "event_type"::"text"::"public"."alert_notification_events_event_type_enum"`);
        await queryRunner.query(`DROP TYPE "public"."alert_notification_event_type_enum_old"`);
        await queryRunner.query(`ALTER TYPE "public"."alert_notification_channel_enum" RENAME TO "alert_notification_channel_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."alert_notification_events_channel_enum" AS ENUM('email', 'push', 'sms')`);
        await queryRunner.query(`ALTER TABLE "alert_notification_events" ALTER COLUMN "channel" TYPE "public"."alert_notification_events_channel_enum" USING "channel"::"text"::"public"."alert_notification_events_channel_enum"`);
        await queryRunner.query(`DROP TYPE "public"."alert_notification_channel_enum_old"`);
        await queryRunner.query(`ALTER TYPE "public"."alert_notification_event_status_enum" RENAME TO "alert_notification_event_status_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."alert_notification_events_status_enum" AS ENUM('pending', 'sent', 'skipped')`);
        await queryRunner.query(`ALTER TABLE "alert_notification_events" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "alert_notification_events" ALTER COLUMN "status" TYPE "public"."alert_notification_events_status_enum" USING "status"::"text"::"public"."alert_notification_events_status_enum"`);
        await queryRunner.query(`ALTER TABLE "alert_notification_events" ALTER COLUMN "status" SET DEFAULT 'pending'`);
        await queryRunner.query(`DROP TYPE "public"."alert_notification_event_status_enum_old"`);
        await queryRunner.query(`ALTER TYPE "public"."alert_notification_frequency_enum" RENAME TO "alert_notification_frequency_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."alert_notification_preferences_frequency_enum" AS ENUM('instant', 'daily', 'weekly')`);
        await queryRunner.query(`ALTER TABLE "alert_notification_preferences" ALTER COLUMN "frequency" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "alert_notification_preferences" ALTER COLUMN "frequency" TYPE "public"."alert_notification_preferences_frequency_enum" USING "frequency"::"text"::"public"."alert_notification_preferences_frequency_enum"`);
        await queryRunner.query(`ALTER TABLE "alert_notification_preferences" ALTER COLUMN "frequency" SET DEFAULT 'instant'`);
        await queryRunner.query(`DROP TYPE "public"."alert_notification_frequency_enum_old"`);
        await queryRunner.query(`ALTER TYPE "public"."alert_notification_event_type_enum" RENAME TO "alert_notification_event_type_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."alert_notification_events_event_type_enum" AS ENUM('new_listing', 'price_drop', 'sold_removed', 'featured', 'recently_updated', 'favorite_change', 'new_message', 'seller_reply', 'saved_vehicle_reminder')`);
        await queryRunner.query(`ALTER TABLE "alert_notification_events" ALTER COLUMN "event_type" TYPE "public"."alert_notification_events_event_type_enum" USING "event_type"::"text"::"public"."alert_notification_events_event_type_enum"`);
        await queryRunner.query(`DROP TYPE "public"."alert_notification_event_type_enum_old"`);
        await queryRunner.query(`ALTER TYPE "public"."alert_notification_channel_enum" RENAME TO "alert_notification_channel_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."alert_notification_events_channel_enum" AS ENUM('email', 'push', 'sms')`);
        await queryRunner.query(`ALTER TABLE "alert_notification_events" ALTER COLUMN "channel" TYPE "public"."alert_notification_events_channel_enum" USING "channel"::"text"::"public"."alert_notification_events_channel_enum"`);
        await queryRunner.query(`DROP TYPE "public"."alert_notification_channel_enum_old"`);
        await queryRunner.query(`ALTER TYPE "public"."alert_notification_event_status_enum" RENAME TO "alert_notification_event_status_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."alert_notification_events_status_enum" AS ENUM('pending', 'sent', 'skipped')`);
        await queryRunner.query(`ALTER TABLE "alert_notification_events" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "alert_notification_events" ALTER COLUMN "status" TYPE "public"."alert_notification_events_status_enum" USING "status"::"text"::"public"."alert_notification_events_status_enum"`);
        await queryRunner.query(`ALTER TABLE "alert_notification_events" ALTER COLUMN "status" SET DEFAULT 'pending'`);
        await queryRunner.query(`DROP TYPE "public"."alert_notification_event_status_enum_old"`);
        await queryRunner.query(`ALTER TABLE "alert_notification_preferences" ADD CONSTRAINT "FK_317e173a12872a5b11e6f0a2f99" FOREIGN KEY ("profile_id") REFERENCES "profile"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "alert_notification_events" ADD CONSTRAINT "FK_efceb46bc2586f23354de4f390a" FOREIGN KEY ("alert_id") REFERENCES "alerts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "alert_notification_events" DROP CONSTRAINT "FK_efceb46bc2586f23354de4f390a"`);
        await queryRunner.query(`ALTER TABLE "alert_notification_preferences" DROP CONSTRAINT "FK_317e173a12872a5b11e6f0a2f99"`);
        await queryRunner.query(`CREATE TYPE "public"."alert_notification_event_status_enum_old" AS ENUM('pending', 'sent', 'skipped')`);
        await queryRunner.query(`ALTER TABLE "alert_notification_events" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "alert_notification_events" ALTER COLUMN "status" TYPE "public"."alert_notification_event_status_enum_old" USING "status"::"text"::"public"."alert_notification_event_status_enum_old"`);
        await queryRunner.query(`ALTER TABLE "alert_notification_events" ALTER COLUMN "status" SET DEFAULT 'pending'`);
        await queryRunner.query(`DROP TYPE "public"."alert_notification_events_status_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."alert_notification_event_status_enum_old" RENAME TO "alert_notification_event_status_enum"`);
        await queryRunner.query(`CREATE TYPE "public"."alert_notification_channel_enum_old" AS ENUM('email', 'push', 'sms')`);
        await queryRunner.query(`ALTER TABLE "alert_notification_events" ALTER COLUMN "channel" TYPE "public"."alert_notification_channel_enum_old" USING "channel"::"text"::"public"."alert_notification_channel_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."alert_notification_events_channel_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."alert_notification_channel_enum_old" RENAME TO "alert_notification_channel_enum"`);
        await queryRunner.query(`CREATE TYPE "public"."alert_notification_event_type_enum_old" AS ENUM('new_listing', 'price_drop', 'sold_removed', 'featured', 'recently_updated', 'favorite_change', 'new_message', 'seller_reply', 'saved_vehicle_reminder')`);
        await queryRunner.query(`ALTER TABLE "alert_notification_events" ALTER COLUMN "event_type" TYPE "public"."alert_notification_event_type_enum_old" USING "event_type"::"text"::"public"."alert_notification_event_type_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."alert_notification_events_event_type_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."alert_notification_event_type_enum_old" RENAME TO "alert_notification_event_type_enum"`);
        await queryRunner.query(`CREATE TYPE "public"."alert_notification_frequency_enum_old" AS ENUM('instant', 'daily', 'weekly')`);
        await queryRunner.query(`ALTER TABLE "alert_notification_preferences" ALTER COLUMN "frequency" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "alert_notification_preferences" ALTER COLUMN "frequency" TYPE "public"."alert_notification_frequency_enum_old" USING "frequency"::"text"::"public"."alert_notification_frequency_enum_old"`);
        await queryRunner.query(`ALTER TABLE "alert_notification_preferences" ALTER COLUMN "frequency" SET DEFAULT 'instant'`);
        await queryRunner.query(`DROP TYPE "public"."alert_notification_preferences_frequency_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."alert_notification_frequency_enum_old" RENAME TO "alert_notification_frequency_enum"`);
        await queryRunner.query(`CREATE TYPE "public"."alert_notification_event_status_enum_old" AS ENUM('pending', 'sent', 'skipped')`);
        await queryRunner.query(`ALTER TABLE "alert_notification_events" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "alert_notification_events" ALTER COLUMN "status" TYPE "public"."alert_notification_event_status_enum_old" USING "status"::"text"::"public"."alert_notification_event_status_enum_old"`);
        await queryRunner.query(`ALTER TABLE "alert_notification_events" ALTER COLUMN "status" SET DEFAULT 'pending'`);
        await queryRunner.query(`DROP TYPE "public"."alert_notification_events_status_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."alert_notification_event_status_enum_old" RENAME TO "alert_notification_event_status_enum"`);
        await queryRunner.query(`CREATE TYPE "public"."alert_notification_channel_enum_old" AS ENUM('email', 'push', 'sms')`);
        await queryRunner.query(`ALTER TABLE "alert_notification_events" ALTER COLUMN "channel" TYPE "public"."alert_notification_channel_enum_old" USING "channel"::"text"::"public"."alert_notification_channel_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."alert_notification_events_channel_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."alert_notification_channel_enum_old" RENAME TO "alert_notification_channel_enum"`);
        await queryRunner.query(`CREATE TYPE "public"."alert_notification_event_type_enum_old" AS ENUM('new_listing', 'price_drop', 'sold_removed', 'featured', 'recently_updated', 'favorite_change', 'new_message', 'seller_reply', 'saved_vehicle_reminder')`);
        await queryRunner.query(`ALTER TABLE "alert_notification_events" ALTER COLUMN "event_type" TYPE "public"."alert_notification_event_type_enum_old" USING "event_type"::"text"::"public"."alert_notification_event_type_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."alert_notification_events_event_type_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."alert_notification_event_type_enum_old" RENAME TO "alert_notification_event_type_enum"`);
        await queryRunner.query(`CREATE TYPE "public"."alert_notification_frequency_enum_old" AS ENUM('instant', 'daily', 'weekly')`);
        await queryRunner.query(`ALTER TABLE "alert_notification_preferences" ALTER COLUMN "frequency" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "alert_notification_preferences" ALTER COLUMN "frequency" TYPE "public"."alert_notification_frequency_enum_old" USING "frequency"::"text"::"public"."alert_notification_frequency_enum_old"`);
        await queryRunner.query(`ALTER TABLE "alert_notification_preferences" ALTER COLUMN "frequency" SET DEFAULT 'instant'`);
        await queryRunner.query(`DROP TYPE "public"."alert_notification_preferences_frequency_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."alert_notification_frequency_enum_old" RENAME TO "alert_notification_frequency_enum"`);
        await queryRunner.query(`ALTER TABLE "profile" DROP COLUMN "type"`);
        await queryRunner.query(`DROP TYPE "public"."profile_type_enum"`);
        await queryRunner.query(`CREATE UNIQUE INDEX "UQ_alert_notification_events_dedup" ON "alert_notification_events" ("alert_id", "event_type", "vehicle_id") WHERE ((alert_id IS NOT NULL) AND (vehicle_id IS NOT NULL))`);
        await queryRunner.query(`CREATE INDEX "IDX_alert_notification_events_pending_digest" ON "alert_notification_events" ("scheduled_for", "status") `);
        await queryRunner.query(`CREATE INDEX "IDX_alert_notification_events_profile_id" ON "alert_notification_events" ("profile_id") `);
        await queryRunner.query(`ALTER TABLE "alert_notification_events" ADD CONSTRAINT "FK_alert_notification_events_profile_id" FOREIGN KEY ("profile_id") REFERENCES "profile"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "alert_notification_events" ADD CONSTRAINT "FK_alert_notification_events_alert_id" FOREIGN KEY ("alert_id") REFERENCES "alerts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "alert_notification_preferences" ADD CONSTRAINT "FK_alert_notification_preferences_profile_id" FOREIGN KEY ("profile_id") REFERENCES "profile"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
