import { MigrationInterface, QueryRunner } from "typeorm";

export class DealershipFinancing1793050949089 implements MigrationInterface {
  name = "DealershipFinancing1793050949089";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "dealership_financing_settings" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "dealership_id" uuid NOT NULL, "enabled" boolean NOT NULL DEFAULT false, "financial_entity" character varying(120), "tin" numeric(5,2) NOT NULL DEFAULT '0', "declared_tae" numeric(5,2), "min_term_months" integer NOT NULL DEFAULT '12', "max_term_months" integer NOT NULL DEFAULT '84', "default_term_months" integer NOT NULL DEFAULT '60', "default_down_payment_percent" numeric(5,2) NOT NULL DEFAULT '20', "min_down_payment_percent" numeric(5,2) NOT NULL DEFAULT '10', "max_down_payment_percent" numeric(5,2) NOT NULL DEFAULT '50', "min_financeable_amount" numeric(12,2) NOT NULL DEFAULT '3000', "opening_fee_percent" numeric(5,2) NOT NULL DEFAULT '0', "opening_fee_fixed" numeric(12,2), "other_conditions" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_6aaef18c8a71149ea91c89d31e7" UNIQUE ("dealership_id"), CONSTRAINT "REL_6aaef18c8a71149ea91c89d31e" UNIQUE ("dealership_id"), CONSTRAINT "PK_b90d8bb2b0110272b8cf2db5ec1" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "vehicles" ADD "offer_financing" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "leads" ADD "financing_snapshot" jsonb`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."lead_type" ADD VALUE IF NOT EXISTS 'financing'`,
    );
    await queryRunner.query(
      `ALTER TABLE "dealership_financing_settings" ADD CONSTRAINT "FK_6aaef18c8a71149ea91c89d31e7" FOREIGN KEY ("dealership_id") REFERENCES "dealerships"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "dealership_financing_settings" DROP CONSTRAINT "FK_6aaef18c8a71149ea91c89d31e7"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."lead_type_old" AS ENUM('contact', 'call_me')`,
    );
    await queryRunner.query(
      `ALTER TABLE "leads" ALTER COLUMN "type" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "leads" ALTER COLUMN "type" TYPE "public"."lead_type_old" USING "type"::"text"::"public"."lead_type_old"`,
    );
    await queryRunner.query(
      `ALTER TABLE "leads" ALTER COLUMN "type" SET DEFAULT 'contact'`,
    );
    await queryRunner.query(`DROP TYPE "public"."lead_type"`);
    await queryRunner.query(
      `ALTER TYPE "public"."lead_type_old" RENAME TO "lead_type"`,
    );
    await queryRunner.query(
      `ALTER TABLE "leads" DROP COLUMN "financing_snapshot"`,
    );
    await queryRunner.query(
      `ALTER TABLE "vehicles" DROP COLUMN "offer_financing"`,
    );
    await queryRunner.query(`DROP TABLE "dealership_financing_settings"`);
  }
}
