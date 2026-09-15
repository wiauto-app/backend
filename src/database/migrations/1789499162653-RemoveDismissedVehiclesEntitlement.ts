import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Elimina el entitlement `dismissed_vehicles` de planes y overrides.
 * La tabla `dismissed_vehicles` (engagement) no se toca: la feature queda libre con JWT.
 */
export class RemoveDismissedVehiclesEntitlement1789499162653
  implements MigrationInterface
{
  name = "RemoveDismissedVehiclesEntitlement1789499162653";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM "plan_entitlements"
      WHERE "feature" = 'dismissed_vehicles'
    `);

    await queryRunner.query(`
      DELETE FROM "subscription_entitlement_overrides"
      WHERE "feature" = 'dismissed_vehicles'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO "plan_entitlements" (
        "id", "plan_version_id", "feature", "value_type", "value", "created_at", "updated_at"
      )
      SELECT
        uuid_generate_v4(),
        pv."id",
        'dismissed_vehicles',
        'boolean'::"public"."entitlement_value_type_enum",
        '{"bool": true}'::jsonb,
        NOW(),
        NOW()
      FROM "plan_versions" pv
      INNER JOIN "subscription_plans" sp ON sp."id" = pv."plan_id"
      WHERE pv."status" = 'published'
        AND sp."audience" = 'dealership'
      ON CONFLICT ("plan_version_id", "feature") DO NOTHING
    `);
  }
}
