import { MigrationInterface, QueryRunner } from "typeorm";

export class MunicipalitiesGeomIndex1776383417064 implements MigrationInterface {
    name = 'MunicipalitiesGeomIndex1776383417064'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "municipalities" RENAME COLUMN "ine_code" TO "ineCode"`);
        await queryRunner.query(`CREATE INDEX "IDX_f57c1d3864b6cf42c82da21aac" ON "municipalities" USING GiST ("geom") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_f57c1d3864b6cf42c82da21aac"`);
        await queryRunner.query(`ALTER TABLE "municipalities" RENAME COLUMN "ineCode" TO "ine_code"`);
    }

}
