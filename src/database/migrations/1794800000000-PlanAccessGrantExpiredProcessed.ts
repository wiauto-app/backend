import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * `expired_processed_at`: marca los grants vencidos ya procesados por el job
 * diario (libera el plan del concesionario y resincroniza el publicador).
 * Los grants ya vencidos quedan en NULL a propósito: el primer run los procesa.
 */
export class PlanAccessGrantExpiredProcessed1794800000000
  implements MigrationInterface
{
  name = "PlanAccessGrantExpiredProcessed1794800000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "plan_access_grants"
      ADD COLUMN IF NOT EXISTS "expired_processed_at" TIMESTAMP
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_plan_access_grants_pending_expiry"
      ON "plan_access_grants" ("expires_at")
      WHERE "revoked_at" IS NULL
        AND "expired_processed_at" IS NULL
        AND "expires_at" IS NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_plan_access_grants_pending_expiry"`,
    );
    await queryRunner.query(`
      ALTER TABLE "plan_access_grants"
      DROP COLUMN IF EXISTS "expired_processed_at"
    `);
  }
}
