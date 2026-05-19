import { MigrationInterface, QueryRunner } from "typeorm";

export class UserDeletedAt1778815252172 implements MigrationInterface {
    name = 'UserDeletedAt1778815252172'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "deleted_at" TIMESTAMP`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "deleted_at"`);
    }

}
