import { MigrationInterface, QueryRunner } from "typeorm";

export class AppraisalEstimatesAndOffers1791500000000 implements MigrationInterface {
  name = "AppraisalEstimatesAndOffers1791500000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "appraisal_requests_status_enum" ADD VALUE IF NOT EXISTS 'estimated'`,
    );
    await queryRunner.query(
      `ALTER TYPE "appraisal_requests_status_enum" ADD VALUE IF NOT EXISTS 'open_for_offers'`,
    );
    await queryRunner.query(
      `ALTER TYPE "appraisal_requests_status_enum" ADD VALUE IF NOT EXISTS 'offer_accepted'`,
    );
    await queryRunner.query(
      `ALTER TYPE "appraisal_requests_status_enum" ADD VALUE IF NOT EXISTS 'expired'`,
    );

    await queryRunner.query(`
      ALTER TABLE "appraisal_requests"
        ALTER COLUMN "lat" DROP NOT NULL,
        ALTER COLUMN "lng" DROP NOT NULL,
        ADD COLUMN "recommended_price" numeric,
        ADD COLUMN "ai_explanation" text,
        ADD COLUMN "ai_confidence" character varying(16),
        ADD COLUMN "ai_source" character varying(16),
        ADD COLUMN "power" integer,
        ADD COLUMN "plate" character varying(16),
        ADD COLUMN "offers_requested_at" TIMESTAMP WITH TIME ZONE,
        ADD COLUMN "offers_expire_at" TIMESTAMP WITH TIME ZONE,
        ADD COLUMN "accepted_offer_id" uuid
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_appraisal_requests_profile" ON "appraisal_requests" ("profile_id")
    `);

    await queryRunner.query(`
      CREATE TYPE "appraisal_offers_status_enum" AS ENUM ('pending', 'accepted', 'rejected', 'withdrawn', 'expired')
    `);

    await queryRunner.query(`
      CREATE TABLE "appraisal_offers" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "appraisal_request_id" uuid NOT NULL,
        "dealership_id" uuid NOT NULL,
        "created_by_profile_id" uuid NOT NULL,
        "amount" numeric NOT NULL,
        "message" text,
        "status" "appraisal_offers_status_enum" NOT NULL DEFAULT 'pending',
        "responded_at" TIMESTAMP WITH TIME ZONE,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_appraisal_offers" PRIMARY KEY ("id"),
        CONSTRAINT "FK_appraisal_offers_request"
          FOREIGN KEY ("appraisal_request_id") REFERENCES "appraisal_requests"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_appraisal_offers_dealership"
          FOREIGN KEY ("dealership_id") REFERENCES "dealerships"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_appraisal_offers_created_by"
          FOREIGN KEY ("created_by_profile_id") REFERENCES "profile"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_appraisal_offers_active_dealership"
        ON "appraisal_offers" ("appraisal_request_id", "dealership_id")
        WHERE "status" = 'pending'
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_appraisal_offers_request" ON "appraisal_offers" ("appraisal_request_id")
    `);

    await queryRunner.query(`
      ALTER TABLE "appraisal_requests"
        ADD CONSTRAINT "FK_appraisal_requests_accepted_offer"
        FOREIGN KEY ("accepted_offer_id") REFERENCES "appraisal_offers"("id") ON DELETE SET NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "appraisal_requests" DROP CONSTRAINT "FK_appraisal_requests_accepted_offer"`,
    );
    await queryRunner.query(`DROP TABLE "appraisal_offers"`);
    await queryRunner.query(`DROP TYPE "appraisal_offers_status_enum"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_appraisal_requests_profile"`);
    // Las filas sin ubicación (tasaciones IA) se eliminan para poder restaurar NOT NULL.
    await queryRunner.query(`DELETE FROM "appraisal_requests" WHERE "lat" IS NULL OR "lng" IS NULL`);
    await queryRunner.query(`
      ALTER TABLE "appraisal_requests"
        DROP COLUMN "accepted_offer_id",
        DROP COLUMN "offers_expire_at",
        DROP COLUMN "offers_requested_at",
        DROP COLUMN "plate",
        DROP COLUMN "power",
        DROP COLUMN "ai_source",
        DROP COLUMN "ai_confidence",
        DROP COLUMN "ai_explanation",
        DROP COLUMN "recommended_price",
        ALTER COLUMN "lat" SET NOT NULL,
        ALTER COLUMN "lng" SET NOT NULL
    `);
    // Postgres no permite quitar valores de un enum: 'estimated', 'open_for_offers',
    // 'offer_accepted' y 'expired' quedan en appraisal_requests_status_enum.
  }
}
