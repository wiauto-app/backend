import { MigrationInterface, QueryRunner } from "typeorm";

export class DiscountCoupons1786100000000 implements MigrationInterface {
  name = "DiscountCoupons1786100000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "discount_coupons" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "code" character varying NOT NULL,
        "name" character varying NOT NULL,
        "percent_off" numeric(5,2),
        "amount_off_cents" integer,
        "currency" character varying(3),
        "stripe_coupon_id" character varying NOT NULL,
        "stripe_promotion_code_id" character varying NOT NULL,
        "max_redemptions" integer NOT NULL DEFAULT 1,
        "times_redeemed" integer NOT NULL DEFAULT 0,
        "active" boolean NOT NULL DEFAULT true,
        "expires_at" TIMESTAMPTZ,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_discount_coupons" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_discount_coupons_code" UNIQUE ("code"),
        CONSTRAINT "UQ_discount_coupons_stripe_coupon_id" UNIQUE ("stripe_coupon_id"),
        CONSTRAINT "UQ_discount_coupons_stripe_promotion_code_id" UNIQUE ("stripe_promotion_code_id"),
        CONSTRAINT "CHK_discount_coupons_discount"
          CHECK (
            ("percent_off" IS NOT NULL AND "amount_off_cents" IS NULL)
            OR ("percent_off" IS NULL AND "amount_off_cents" IS NOT NULL)
          )
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_discount_coupons_active"
      ON "discount_coupons" ("active")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_discount_coupons_active"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "discount_coupons"`);
  }
}
