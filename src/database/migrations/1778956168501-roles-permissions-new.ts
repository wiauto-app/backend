import { MigrationInterface, QueryRunner } from "typeorm";

export class RolesPermissionsNew1778956168501 implements MigrationInterface {
    name = 'RolesPermissionsNew1778956168501'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "roles_permissions" DROP CONSTRAINT "PK_298f2c0e2ea45289aa0c4ac8a02"`);
        await queryRunner.query(`ALTER TABLE "roles_permissions" DROP COLUMN "id"`);
        await queryRunner.query(`ALTER TABLE "roles_permissions" ADD "created_at" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "roles_permissions" ADD "updated_at" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "roles_permissions" ADD CONSTRAINT "PK_0cd11f0b35c4d348c6ebb9b36b7" PRIMARY KEY ("role_id", "permission_id")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "roles_permissions" DROP CONSTRAINT "PK_0cd11f0b35c4d348c6ebb9b36b7"`);
        await queryRunner.query(`ALTER TABLE "roles_permissions" DROP COLUMN "updated_at"`);
        await queryRunner.query(`ALTER TABLE "roles_permissions" DROP COLUMN "created_at"`);
        await queryRunner.query(`ALTER TABLE "roles_permissions" ADD "id" uuid NOT NULL DEFAULT uuid_generate_v4()`);
        await queryRunner.query(`ALTER TABLE "roles_permissions" ADD CONSTRAINT "PK_298f2c0e2ea45289aa0c4ac8a02" PRIMARY KEY ("id")`);
    }

}
