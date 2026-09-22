import { MigrationInterface, QueryRunner } from "typeorm";

export class EnableAlertPushChannel1790700000000 implements MigrationInterface {
  name = "EnableAlertPushChannel1790700000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "alerts" ALTER COLUMN "notification_channels" SET DEFAULT '["email","push","in_app"]'`,
    );
    await queryRunner.query(`
      UPDATE "alerts"
      SET "notification_channels" = (
        SELECT COALESCE(jsonb_agg(channel), '["email","push","in_app"]'::jsonb)
        FROM (
          SELECT DISTINCT channel
          FROM (
            SELECT jsonb_array_elements_text("notification_channels") AS channel
            UNION ALL
            SELECT 'push'
          ) AS candidates
          WHERE channel IN ('email', 'push', 'in_app')
        ) AS enabled
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "alerts" ALTER COLUMN "notification_channels" SET DEFAULT '["email","in_app"]'`,
    );
  }
}
