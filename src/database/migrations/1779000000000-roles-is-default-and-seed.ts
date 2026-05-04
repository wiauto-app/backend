import { MigrationInterface, QueryRunner } from "typeorm";

export class RolesIsDefaultAndSeed1779000000000 implements MigrationInterface {
  name = "RolesIsDefaultAndSeed1779000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "roles" ADD "is_default" boolean NOT NULL DEFAULT false`,
    );

    await queryRunner.query(`
      INSERT INTO "roles" ("name", "is_admin", "is_developer", "is_default", "created_at", "updated_at")
      SELECT x.name, x.is_admin, x.is_developer, x.is_default, now(), now()
      FROM (
        VALUES
          ('buyer', false, false, true),
          ('seller', false, false, false),
          ('admin', true, false, false),
          ('developer', false, true, false)
      ) AS x(name, is_admin, is_developer, is_default)
      WHERE NOT EXISTS (SELECT 1 FROM "roles" r WHERE r.name = x.name)
    `);

    await queryRunner.query(`
      UPDATE "roles"
      SET "is_default" = ("name" = 'buyer')
      WHERE "name" IN ('buyer', 'seller', 'admin', 'developer')
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "profile"
      SET "role_id" = NULL
      WHERE "role_id" IN (
        SELECT "id" FROM "roles" WHERE "name" IN ('buyer', 'seller', 'admin', 'developer')
      )
    `);
    await queryRunner.query(
      `DELETE FROM "roles" WHERE "name" IN ('buyer', 'seller', 'admin', 'developer')`,
    );
    await queryRunner.query(`ALTER TABLE "roles" DROP COLUMN "is_default"`);
  }
}
