import { MigrationInterface, QueryRunner } from "typeorm";

export class UsersIsAdmin1786800000000 implements MigrationInterface {
  name = "UsersIsAdmin1786800000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN IF NOT EXISTS "is_admin" boolean NOT NULL DEFAULT false
    `);

    await queryRunner.query(`
      UPDATE "users" u
      SET "is_admin" = true
      FROM "profile" p
      INNER JOIN "roles" r ON r.id = p.role_id
      WHERE p.id = u.id
        AND (r.is_admin = true OR r.is_developer = true)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users" DROP COLUMN IF EXISTS "is_admin"
    `);
  }
}
