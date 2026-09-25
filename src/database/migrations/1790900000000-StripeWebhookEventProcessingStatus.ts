import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Turns stripe_webhook_events from a "seen" marker into a processing ledger.
 *
 * Before: the row was inserted BEFORE handling, so a failed handler left the
 * event deduped forever and Stripe's retry was dropped. Now a row is
 * `processing` while claimed, `failed` after an error (retryable) and
 * `processed` only after success.
 *
 * Existing rows are backfilled as `processed` (legacy semantics: they were
 * already treated as done), keeping their original `processed_at`.
 */
export class StripeWebhookEventProcessingStatus1790900000000
  implements MigrationInterface
{
  name = "StripeWebhookEventProcessingStatus1790900000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "stripe_webhook_event_status_enum"
      AS ENUM ('processing', 'processed', 'failed')
    `);

    await queryRunner.query(`
      ALTER TABLE "stripe_webhook_events"
        ADD COLUMN "status" "stripe_webhook_event_status_enum" NOT NULL DEFAULT 'processed',
        ADD COLUMN "attempts" integer NOT NULL DEFAULT 1,
        ADD COLUMN "last_error" text NULL,
        ADD COLUMN "claimed_at" TIMESTAMP NOT NULL DEFAULT now(),
        ADD COLUMN "created_at" TIMESTAMP NOT NULL DEFAULT now()
    `);

    await queryRunner.query(`
      UPDATE "stripe_webhook_events"
      SET "created_at" = "processed_at", "claimed_at" = "processed_at"
    `);

    await queryRunner.query(`
      ALTER TABLE "stripe_webhook_events"
        ALTER COLUMN "status" SET DEFAULT 'processing',
        ALTER COLUMN "processed_at" DROP NOT NULL,
        ALTER COLUMN "processed_at" DROP DEFAULT
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_stripe_webhook_events_status"
      ON "stripe_webhook_events" ("status")
      WHERE "status" <> 'processed'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_stripe_webhook_events_status"`,
    );

    // Unfinished events must not come back as "already processed" under the
    // legacy semantics: drop them so Stripe redeliveries are handled again.
    await queryRunner.query(`
      DELETE FROM "stripe_webhook_events" WHERE "status" <> 'processed'
    `);

    await queryRunner.query(`
      ALTER TABLE "stripe_webhook_events"
        ALTER COLUMN "processed_at" SET DEFAULT now()
    `);
    await queryRunner.query(`
      UPDATE "stripe_webhook_events"
      SET "processed_at" = "created_at"
      WHERE "processed_at" IS NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "stripe_webhook_events"
        ALTER COLUMN "processed_at" SET NOT NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "stripe_webhook_events"
        DROP COLUMN "created_at",
        DROP COLUMN "claimed_at",
        DROP COLUMN "last_error",
        DROP COLUMN "attempts",
        DROP COLUMN "status"
    `);

    await queryRunner.query(`DROP TYPE "stripe_webhook_event_status_enum"`);
  }
}
