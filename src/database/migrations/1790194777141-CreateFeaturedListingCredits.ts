import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateFeaturedListingCredits1790194777141
  implements MigrationInterface
{
  name = "CreateFeaturedListingCredits1790194777141";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "featured_listing_credits" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "profile_id" uuid NOT NULL,
        "offer_id" uuid,
        "duration_days" integer NOT NULL,
        "boost_weight" integer NOT NULL DEFAULT '50',
        "stripe_checkout_session_id" character varying,
        "consumed_at" TIMESTAMP WITH TIME ZONE,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_featured_listing_credits_stripe_checkout_session_id" UNIQUE ("stripe_checkout_session_id"),
        CONSTRAINT "PK_featured_listing_credits" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_featured_listing_credits_profile_id" ON "featured_listing_credits" ("profile_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_featured_listing_credits_consumed_at" ON "featured_listing_credits" ("consumed_at")`,
    );
    await queryRunner.query(`
      ALTER TABLE "featured_listing_credits"
      ADD CONSTRAINT "FK_featured_listing_credits_profile"
      FOREIGN KEY ("profile_id") REFERENCES "profile"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "featured_listing_credits"
      ADD CONSTRAINT "FK_featured_listing_credits_offer"
      FOREIGN KEY ("offer_id") REFERENCES "featured_listing_offers"("id")
      ON DELETE SET NULL ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "featured_listing_credits" DROP CONSTRAINT "FK_featured_listing_credits_offer"`,
    );
    await queryRunner.query(
      `ALTER TABLE "featured_listing_credits" DROP CONSTRAINT "FK_featured_listing_credits_profile"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_featured_listing_credits_consumed_at"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_featured_listing_credits_profile_id"`,
    );
    await queryRunner.query(`DROP TABLE "featured_listing_credits"`);
  }
}
