import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Rename professional → dealership for plan audience + vehicle publisher_type.
 * Seed dismissed_vehicles + advanced_listing_editor on published dealership plan versions.
 */
export class DealershipAudienceAndEntitlements1786500000000
  implements MigrationInterface
{
  name = "DealershipAudienceAndEntitlements1786500000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TYPE "public"."subscription_plan_audience_enum"
      RENAME VALUE 'professional' TO 'dealership'
    `);

    await queryRunner.query(`
      ALTER TYPE "public"."vehicles_publisher_type_enum"
      RENAME VALUE 'professional' TO 'dealership'
    `);

    await queryRunner.query(`
      ALTER TABLE "vehicles"
      ALTER COLUMN "publisher_type"
      SET DEFAULT 'particular'
    `);

    await queryRunner.query(`
      INSERT INTO "plan_entitlements" (
        "id", "plan_version_id", "feature", "value_type", "value", "created_at", "updated_at"
      )
      SELECT
        uuid_generate_v4(),
        pv."id",
        feature.feature,
        'boolean'::"public"."entitlement_value_type_enum",
        '{"bool": true}'::jsonb,
        NOW(),
        NOW()
      FROM "plan_versions" pv
      INNER JOIN "subscription_plans" sp ON sp."id" = pv."plan_id"
      CROSS JOIN (
        VALUES
          ('dismissed_vehicles'),
          ('advanced_listing_editor')
      ) AS feature(feature)
      WHERE pv."status" = 'published'
        AND sp."audience" = 'dealership'
      ON CONFLICT ("plan_version_id", "feature") DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM "plan_entitlements"
      WHERE "feature" IN ('dismissed_vehicles', 'advanced_listing_editor')
    `);

    await queryRunner.query(`
      ALTER TABLE "vehicles"
      ALTER COLUMN "publisher_type"
      SET DEFAULT 'dealership'
    `);

    await queryRunner.query(`
      ALTER TYPE "public"."vehicles_publisher_type_enum"
      RENAME VALUE 'dealership' TO 'professional'
    `);

    await queryRunner.query(`
      ALTER TYPE "public"."subscription_plan_audience_enum"
      RENAME VALUE 'dealership' TO 'professional'
    `);
  }
}
