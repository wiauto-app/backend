import { MigrationInterface, QueryRunner } from "typeorm";

export class ProfileType1781758111012 implements MigrationInterface {
  name = "ProfileType1781758111012";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."profile_type_enum" AS ENUM ('professional', 'particular');
      EXCEPTION
        WHEN duplicate_object THEN NULL;
      END $$;
    `);
    await queryRunner.query(
      `ALTER TABLE "profile" ADD COLUMN IF NOT EXISTS "type" "public"."profile_type_enum" NOT NULL DEFAULT 'particular'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "profile" DROP COLUMN IF EXISTS "type"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."profile_type_enum"`);
  }
}
