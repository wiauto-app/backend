import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * refresh_tokens.user_id nació como varchar; users.id es uuid.
 * Al cargar la relación `user`, Postgres falla con:
 * operator does not exist: uuid = character varying
 */
export class RefreshUserRelation1786247217650 implements MigrationInterface {
  name = "RefreshUserRelation1786247217650";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "refresh_tokens" AS rt
      SET "user_id" = s."user_id"::text
      FROM "sessions" AS s
      WHERE rt."session_id" = s."id"
        AND (
          rt."user_id" IS NULL
          OR btrim(rt."user_id") = ''
          OR rt."user_id" !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        )
    `);

    await queryRunner.query(`
      DELETE FROM "refresh_tokens" AS rt
      WHERE rt."user_id" IS NULL
         OR btrim(rt."user_id") = ''
         OR rt."user_id" !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
         OR NOT EXISTS (
           SELECT 1 FROM "users" AS u WHERE u."id"::text = rt."user_id"
         )
    `);

    await queryRunner.query(`
      ALTER TABLE "refresh_tokens"
      ALTER COLUMN "user_id" TYPE uuid
      USING "user_id"::uuid
    `);

    await queryRunner.query(`
      ALTER TABLE "refresh_tokens"
      ADD CONSTRAINT "FK_3ddc983c5f7bcf132fd8732c3f4"
      FOREIGN KEY ("user_id") REFERENCES "users"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "refresh_tokens"
      DROP CONSTRAINT "FK_3ddc983c5f7bcf132fd8732c3f4"
    `);

    await queryRunner.query(`
      ALTER TABLE "refresh_tokens"
      ALTER COLUMN "user_id" TYPE character varying
      USING "user_id"::text
    `);
  }
}
