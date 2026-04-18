import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTwoFactor1776457803764 implements MigrationInterface {
    name = 'AddTwoFactor1776457803764'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "two_factor_enabled" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "users" ADD "two_factor_secret" character varying`);
        await queryRunner.query(`ALTER TABLE "users" ADD "two_factor_backup_codes" text`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "two_factor_backup_codes"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "two_factor_secret"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "two_factor_enabled"`);
    }

}
