import { MigrationInterface, QueryRunner } from "typeorm";

export class MunicipalitiesNullable1776382122233 implements MigrationInterface {
    name = 'MunicipalitiesNullable1776382122233'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "municipalities" ALTER COLUMN "ineCode" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "municipalities" ALTER COLUMN "nuts1" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "municipalities" ALTER COLUMN "nuts2" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "municipalities" ALTER COLUMN "nuts3" DROP NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "municipalities" ALTER COLUMN "nuts3" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "municipalities" ALTER COLUMN "nuts2" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "municipalities" ALTER COLUMN "nuts1" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "municipalities" ALTER COLUMN "ineCode" SET NOT NULL`);
    }

}
