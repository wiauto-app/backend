import { MigrationInterface, QueryRunner } from "typeorm";

export class Profilename1776372694452 implements MigrationInterface {
    name = 'Profilename1776372694452'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "profile" RENAME COLUMN "first_name" TO "name"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "profile" RENAME COLUMN "name" TO "first_name"`);
    }

}
