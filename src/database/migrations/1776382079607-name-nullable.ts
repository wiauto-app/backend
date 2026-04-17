import { MigrationInterface, QueryRunner } from "typeorm";

export class NameNullable1776382079607 implements MigrationInterface {
    name = 'NameNullable1776382079607'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "municipalities" ALTER COLUMN "name" DROP NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "municipalities" ALTER COLUMN "name" SET NOT NULL`);
    }

}
