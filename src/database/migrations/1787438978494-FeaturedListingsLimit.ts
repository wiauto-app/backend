import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Convierte featured_listings de boolean a limit (huecos simultáneos).
 * true → { limit: 1 }, false → { limit: 0 }.
 */
export class FeaturedListingsLimit1787438978494 implements MigrationInterface {
  name = "FeaturedListingsLimit1787438978494";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "plan_entitlements"
      SET
        "value_type" = 'limit',
        "value" = CASE
          WHEN ("value"->>'bool') = 'true' THEN '{"limit": 1}'::jsonb
          ELSE '{"limit": 0}'::jsonb
        END
      WHERE "feature" = 'featured_listings'
        AND "value_type" = 'boolean'
    `);

    await queryRunner.query(`
      UPDATE "subscription_entitlement_overrides"
      SET
        "value_type" = 'limit',
        "value" = CASE
          WHEN ("value"->>'bool') = 'true' THEN '{"limit": 1}'::jsonb
          ELSE '{"limit": 0}'::jsonb
        END
      WHERE "feature" = 'featured_listings'
        AND "value_type" = 'boolean'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "plan_entitlements"
      SET
        "value_type" = 'boolean',
        "value" = CASE
          WHEN COALESCE(("value"->>'limit')::int, 0) > 0 THEN '{"bool": true}'::jsonb
          ELSE '{"bool": false}'::jsonb
        END
      WHERE "feature" = 'featured_listings'
        AND "value_type" = 'limit'
    `);

    await queryRunner.query(`
      UPDATE "subscription_entitlement_overrides"
      SET
        "value_type" = 'boolean',
        "value" = CASE
          WHEN COALESCE(("value"->>'limit')::int, 0) > 0 THEN '{"bool": true}'::jsonb
          ELSE '{"bool": false}'::jsonb
        END
      WHERE "feature" = 'featured_listings'
        AND "value_type" = 'limit'
    `);
  }
}
