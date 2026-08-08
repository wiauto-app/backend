import { MigrationInterface, QueryRunner } from "typeorm";

export class DropPlatformRolesPermissions1786900000000
  implements MigrationInterface
{
  name = "DropPlatformRolesPermissions1786900000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "profile" DROP CONSTRAINT IF EXISTS "FK_profile_role_id"
    `);
    await queryRunner.query(`
      ALTER TABLE "profile" DROP CONSTRAINT IF EXISTS "FK_a938665f47ac63d4fb6195ee8b0"
    `);
    await queryRunner.query(`
      DO $$
      DECLARE fk_name text;
      BEGIN
        SELECT tc.constraint_name INTO fk_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name
         AND tc.table_schema = kcu.table_schema
        WHERE tc.table_name = 'profile'
          AND tc.constraint_type = 'FOREIGN KEY'
          AND kcu.column_name = 'role_id'
        LIMIT 1;
        IF fk_name IS NOT NULL THEN
          EXECUTE format('ALTER TABLE profile DROP CONSTRAINT %I', fk_name);
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      ALTER TABLE "subscription_plans" DROP CONSTRAINT IF EXISTS "FK_subscription_plans_role"
    `);

    await queryRunner.query(`
      ALTER TABLE "profile" DROP COLUMN IF EXISTS "role_id"
    `);
    await queryRunner.query(`
      ALTER TABLE "subscription_plans" DROP COLUMN IF EXISTS "role_id"
    `);

    await queryRunner.query(`DROP TABLE IF EXISTS "roles_permissions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "permissions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "roles"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "roles" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying NOT NULL,
        "is_admin" boolean NOT NULL DEFAULT false,
        "is_developer" boolean NOT NULL DEFAULT false,
        "is_default" boolean NOT NULL DEFAULT false,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP,
        CONSTRAINT "PK_roles" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "permissions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying NOT NULL,
        "key" character varying NOT NULL,
        "value" character varying,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP,
        CONSTRAINT "PK_permissions" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "roles_permissions" (
        "role_id" uuid NOT NULL,
        "permission_id" uuid NOT NULL,
        CONSTRAINT "PK_roles_permissions" PRIMARY KEY ("role_id", "permission_id")
      )
    `);
    await queryRunner.query(`
      ALTER TABLE "profile" ADD COLUMN IF NOT EXISTS "role_id" uuid
    `);
    await queryRunner.query(`
      ALTER TABLE "subscription_plans" ADD COLUMN IF NOT EXISTS "role_id" uuid
    `);
  }
}
