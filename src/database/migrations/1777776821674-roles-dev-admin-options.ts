import { MigrationInterface, QueryRunner } from "typeorm";

export class RolesDevAdminOptions1777776821674 implements MigrationInterface {
    name = 'RolesDevAdminOptions1777776821674'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "roles" DROP COLUMN "description"`);
        await queryRunner.query(`ALTER TABLE "roles" ADD "is_admin" boolean NOT NULL`);
        await queryRunner.query(`ALTER TABLE "roles" ADD "is_developer" boolean NOT NULL`);
        await queryRunner.query(`ALTER TABLE "roles" ADD "updated_at" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "roles" ADD "deleted_at" TIMESTAMP`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "roles" DROP COLUMN "deleted_at"`);
        await queryRunner.query(`ALTER TABLE "roles" DROP COLUMN "updated_at"`);
        await queryRunner.query(`ALTER TABLE "roles" DROP COLUMN "is_developer"`);
        await queryRunner.query(`ALTER TABLE "roles" DROP COLUMN "is_admin"`);
        await queryRunner.query(`ALTER TABLE "roles" ADD "description" character varying NOT NULL`);
    }

}
