import { MigrationInterface, QueryRunner } from "typeorm";

export class UserMailVerified1776556459764 implements MigrationInterface {
    name = 'UserMailVerified1776556459764'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "is_email_verified" boolean NOT NULL DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "is_email_verified"`);
    }

}
