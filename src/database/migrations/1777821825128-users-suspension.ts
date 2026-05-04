import { MigrationInterface, QueryRunner } from "typeorm";

export class UsersSuspension1777821825128 implements MigrationInterface {
    name = 'UsersSuspension1777821825128'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "is_suspended" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "users" ADD "suspended_at" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "users" ADD "suspension_reason" character varying`);
        await queryRunner.query(`ALTER TABLE "users" ADD "suspension_end_time" TIMESTAMP`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "suspension_end_time"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "suspension_reason"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "suspended_at"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "is_suspended"`);
    }

}
