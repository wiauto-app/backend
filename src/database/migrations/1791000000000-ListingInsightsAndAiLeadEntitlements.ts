import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Quita video_upload y advanced_listing_editor.
 * Añade listing_insights, ai_replies_per_conversation y ai_lead_conversations
 * en versiones publicadas con false / 0 (nadie los recibe hasta configurar el plan).
 */
export class ListingInsightsAndAiLeadEntitlements1791000000000
  implements MigrationInterface
{
  name = "ListingInsightsAndAiLeadEntitlements1791000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM "plan_entitlements"
      WHERE "feature" IN ('video_upload', 'advanced_listing_editor')
    `);

    await queryRunner.query(`
      DELETE FROM "subscription_entitlement_overrides"
      WHERE "feature" IN ('video_upload', 'advanced_listing_editor')
    `);

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
          ('listing_insights', 'boolean', '{"bool": false}'),
          ('ai_replies_per_conversation', 'limit', '{"limit": 0}'),
          ('ai_lead_conversations', 'limit', '{"limit": 0}')
      ) AS feature(feature, value_type, value)
      WHERE pv."status" = 'published'
      ON CONFLICT ("plan_version_id", "feature") DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM "plan_entitlements"
      WHERE "feature" IN (
        'listing_insights',
        'ai_replies_per_conversation',
        'ai_lead_conversations'
      )
    `);

    await queryRunner.query(`
      DELETE FROM "subscription_entitlement_overrides"
      WHERE "feature" IN (
        'listing_insights',
        'ai_replies_per_conversation',
        'ai_lead_conversations'
      )
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
        '{"bool": false}'::jsonb,
        NOW(),
        NOW()
      FROM "plan_versions" pv
      CROSS JOIN (
        VALUES
          ('video_upload'),
          ('advanced_listing_editor')
      ) AS feature(feature)
      WHERE pv."status" = 'published'
      ON CONFLICT ("plan_version_id", "feature") DO NOTHING
    `);
  }
}
