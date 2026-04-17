import { MigrationInterface, QueryRunner } from "typeorm";

export class ProvincesDateColumnsDeleted1776386326463 implements MigrationInterface {
    name = 'ProvincesDateColumnsDeleted1776386326463'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "provinces" DROP COLUMN "created_at"`);
        await queryRunner.query(`ALTER TABLE "provinces" DROP COLUMN "updated_at"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "provinces" ADD "updated_at" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "provinces" ADD "created_at" TIMESTAMP`);
    }

}
