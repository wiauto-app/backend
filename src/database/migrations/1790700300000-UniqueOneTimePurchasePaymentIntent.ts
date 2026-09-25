import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Makes one-time fulfillment idempotent per PaymentIntent.
 *
 * Before the index can exist, duplicate rows (same non-null
 * stripe_payment_intent_id, produced by concurrent webhook deliveries) are
 * collapsed: the oldest row is kept and inherits `effect_applied: true` if any
 * duplicate had it, so the effect is never re-applied; the rest are deleted.
 * No other table references one_time_purchases, so the delete is safe.
 */
export class UniqueOneTimePurchasePaymentIntent1790700300000
  implements MigrationInterface
{
  name = "UniqueOneTimePurchasePaymentIntent1790700300000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      WITH ranked AS (
        SELECT
          "id",
          "stripe_payment_intent_id",
          ROW_NUMBER() OVER (
            PARTITION BY "stripe_payment_intent_id"
            ORDER BY "created_at" ASC, "id" ASC
          ) AS rn,
          BOOL_OR(COALESCE("metadata"->'effect_applied' = 'true'::jsonb, false)) OVER (
            PARTITION BY "stripe_payment_intent_id"
          ) AS any_applied
        FROM "one_time_purchases"
        WHERE "stripe_payment_intent_id" IS NOT NULL
      )
      UPDATE "one_time_purchases" otp
      SET "metadata" = otp."metadata" || '{"effect_applied": true}'::jsonb
      FROM ranked
      WHERE otp."id" = ranked."id"
        AND ranked.rn = 1
        AND ranked.any_applied
        AND COALESCE(otp."metadata"->'effect_applied' = 'true'::jsonb, false) = false
    `);

    await queryRunner.query(`
      DELETE FROM "one_time_purchases" otp
      USING (
        SELECT
          "id",
          ROW_NUMBER() OVER (
            PARTITION BY "stripe_payment_intent_id"
            ORDER BY "created_at" ASC, "id" ASC
          ) AS rn
        FROM "one_time_purchases"
        WHERE "stripe_payment_intent_id" IS NOT NULL
      ) ranked
      WHERE otp."id" = ranked."id"
        AND ranked.rn > 1
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_one_time_purchases_payment_intent"
      ON "one_time_purchases" ("stripe_payment_intent_id")
      WHERE "stripe_payment_intent_id" IS NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "UQ_one_time_purchases_payment_intent"`,
    );
  }
}
