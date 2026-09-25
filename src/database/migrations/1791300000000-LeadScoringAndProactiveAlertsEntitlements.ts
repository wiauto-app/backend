import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Añade lead_scoring y proactive_alerts en versiones publicadas con false.
 */
export class LeadScoringAndProactiveAlertsEntitlements1791300000000
  implements MigrationInterface
{
  name = "LeadScoringAndProactiveAlertsEntitlements1791300000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    const has_plan_versions = await queryRunner.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'plan_versions'
      ) AS ok
    `);
    if (!has_plan_versions?.[0]?.ok) {
      return;
    }

    await queryRunner.query(`
      INSERT INTO "plan_entitlements" (
        "id", "plan_version_id", "feature", "value_type", "value", "created_at", "updated_at"
      )
      SELECT
        uuid_generate_v4(),
        pv."id",
        feature.feature,
        feature.value_type::"public"."entitlement_value_type_enum",
        feature.value::jsonb,
        NOW(),
        NOW()
      FROM "plan_versions" pv
      CROSS JOIN (
        VALUES
          ('lead_scoring', 'boolean', '{"bool": false}'),
          ('proactive_alerts', 'boolean', '{"bool": false}')
      ) AS feature(feature, value_type, value)
      WHERE pv."status" = 'published'
      ON CONFLICT ("plan_version_id", "feature") DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM "plan_entitlements"
      WHERE "feature" IN ('lead_scoring', 'proactive_alerts')
    `);

    await queryRunner.query(`
      DELETE FROM "subscription_entitlement_overrides"
      WHERE "feature" IN ('lead_scoring', 'proactive_alerts')
    `);
  }
}
