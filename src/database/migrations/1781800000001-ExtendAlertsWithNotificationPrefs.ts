import { MigrationInterface, QueryRunner } from "typeorm";

export class ExtendAlertsWithNotificationPrefs1781800000001
  implements MigrationInterface
{
  name = "ExtendAlertsWithNotificationPrefs1781800000001";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "alerts" ADD "is_active" boolean NOT NULL DEFAULT true`,
    );
    await queryRunner.query(
      `ALTER TABLE "alerts" ADD "notify_new_listings" boolean NOT NULL DEFAULT true`,
    );
    await queryRunner.query(
      `ALTER TABLE "alerts" ADD "notify_price_drops" boolean NOT NULL DEFAULT true`,
    );
    await queryRunner.query(
      `ALTER TABLE "alerts" ADD "notify_sold_removed" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "alerts" ADD "notify_featured" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "alerts" ADD "notify_recently_updated" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "alerts" ADD "last_viewed_at" TIMESTAMP`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "alerts" DROP COLUMN "last_viewed_at"`);
    await queryRunner.query(
      `ALTER TABLE "alerts" DROP COLUMN "notify_recently_updated"`,
    );
    await queryRunner.query(`ALTER TABLE "alerts" DROP COLUMN "notify_featured"`);
    await queryRunner.query(
      `ALTER TABLE "alerts" DROP COLUMN "notify_sold_removed"`,
    );
    await queryRunner.query(
      `ALTER TABLE "alerts" DROP COLUMN "notify_price_drops"`,
    );
    await queryRunner.query(
      `ALTER TABLE "alerts" DROP COLUMN "notify_new_listings"`,
    );
    await queryRunner.query(`ALTER TABLE "alerts" DROP COLUMN "is_active"`);
  }
}
