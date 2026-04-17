import { MigrationInterface, QueryRunner } from "typeorm";

export class Profilemail1776372732862 implements MigrationInterface {
    name = 'Profilemail1776372732862'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "profile" ADD "email" character varying NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "profile" DROP COLUMN "email"`);
    }

}
