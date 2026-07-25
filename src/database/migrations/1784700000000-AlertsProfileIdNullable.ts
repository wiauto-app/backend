import { MigrationInterface, QueryRunner } from "typeorm";

export class AlertsProfileIdNullable1784700000000
  implements MigrationInterface
{
  name = "AlertsProfileIdNullable1784700000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Nombre real tras 1781117875457-version-relations (no FK_alerts_profile_id)
    await queryRunner.query(
      `ALTER TABLE "alerts" DROP CONSTRAINT "FK_f3147b52731056a05d753d79982"`,
    );
    await queryRunner.query(
      `ALTER TABLE "alerts" ALTER COLUMN "profile_id" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "alerts" ADD CONSTRAINT "FK_alerts_profile_id" FOREIGN KEY ("profile_id") REFERENCES "profile"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );

    await queryRunner.query(
      `ALTER TABLE "alert_notification_events" DROP CONSTRAINT "FK_alert_notification_events_profile_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "alert_notification_events" ALTER COLUMN "profile_id" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "alert_notification_events" ADD CONSTRAINT "FK_alert_notification_events_profile_id" FOREIGN KEY ("profile_id") REFERENCES "profile"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM "alert_notification_events" WHERE "profile_id" IS NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "alert_notification_events" DROP CONSTRAINT "FK_alert_notification_events_profile_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "alert_notification_events" ALTER COLUMN "profile_id" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "alert_notification_events" ADD CONSTRAINT "FK_alert_notification_events_profile_id" FOREIGN KEY ("profile_id") REFERENCES "profile"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );

    await queryRunner.query(
      `DELETE FROM "alerts" WHERE "profile_id" IS NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "alerts" DROP CONSTRAINT "FK_alerts_profile_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "alerts" ALTER COLUMN "profile_id" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "alerts" ADD CONSTRAINT "FK_alerts_profile_id" FOREIGN KEY ("profile_id") REFERENCES "profile"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }
}
