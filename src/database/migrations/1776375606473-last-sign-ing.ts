import { MigrationInterface, QueryRunner } from "typeorm";

export class LastSignIng1776375606473 implements MigrationInterface {
    name = 'LastSignIng1776375606473'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" ADD "last_sign_in" TIMESTAMP`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "last_sign_in"`);
    }

}
