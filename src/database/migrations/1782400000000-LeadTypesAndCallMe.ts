import { MigrationInterface, QueryRunner } from "typeorm";

export class LeadTypesAndCallMe1782400000000 implements MigrationInterface {
  name = "LeadTypesAndCallMe1782400000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."lead_type" AS ENUM ('contact', 'call_me');
      EXCEPTION
        WHEN duplicate_object THEN NULL;
      END $$;
    `);

    await queryRunner.query(
      `ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "type" "public"."lead_type" NOT NULL DEFAULT 'contact'`,
    );

    await queryRunner.query(
      `ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "callback_scheduled_at" date`,
    );

    await queryRunner.query(`ALTER TABLE "leads" ALTER COLUMN "email" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "leads" ALTER COLUMN "message" DROP NOT NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "leads" ALTER COLUMN "message" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "leads" ALTER COLUMN "email" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "leads" DROP COLUMN IF EXISTS "callback_scheduled_at"`);
    await queryRunner.query(`ALTER TABLE "leads" DROP COLUMN IF EXISTS "type"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."lead_type"`);
  }
}
