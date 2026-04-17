import { MigrationInterface, QueryRunner } from "typeorm";

export class Provinces1776386291985 implements MigrationInterface {
    name = 'Provinces1776386291985'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."provinces_geom_geom_idx"`);
        await queryRunner.query(`ALTER TABLE "provinces" ADD "id" SERIAL NOT NULL`);
        await queryRunner.query(`ALTER TABLE "provinces" DROP CONSTRAINT "provinces_pkey"`);
        await queryRunner.query(`ALTER TABLE "provinces" ADD CONSTRAINT "provinces_pkey" PRIMARY KEY ("ogc_fid", "id")`);
        await queryRunner.query(`ALTER TABLE "provinces" DROP CONSTRAINT "provinces_pkey"`);
        await queryRunner.query(`ALTER TABLE "provinces" ADD CONSTRAINT "PK_2e4260eedbcad036ec53222e0c7" PRIMARY KEY ("id")`);
        await queryRunner.query(`ALTER TABLE "provinces" ALTER COLUMN "ogc_fid" DROP DEFAULT`);
        await queryRunner.query(`DROP SEQUENCE "provinces_ogc_fid_seq"`);
        await queryRunner.query(`ALTER TABLE "provinces" ALTER COLUMN "cod_prov" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "provinces" ALTER COLUMN "name" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "provinces" ALTER COLUMN "cod_ccaa" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "provinces" ALTER COLUMN "geom" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "provinces" DROP COLUMN "created_at"`);
        await queryRunner.query(`ALTER TABLE "provinces" ADD "created_at" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "provinces" DROP COLUMN "updated_at"`);
        await queryRunner.query(`ALTER TABLE "provinces" ADD "updated_at" TIMESTAMP`);
        await queryRunner.query(`CREATE INDEX "IDX_beeef8ef59277b5a9b645f0b0f" ON "provinces" USING GiST ("geom") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_beeef8ef59277b5a9b645f0b0f"`);
        await queryRunner.query(`ALTER TABLE "provinces" DROP COLUMN "updated_at"`);
        await queryRunner.query(`ALTER TABLE "provinces" ADD "updated_at" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`ALTER TABLE "provinces" DROP COLUMN "created_at"`);
        await queryRunner.query(`ALTER TABLE "provinces" ADD "created_at" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`ALTER TABLE "provinces" ALTER COLUMN "geom" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "provinces" ALTER COLUMN "cod_ccaa" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "provinces" ALTER COLUMN "name" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "provinces" ALTER COLUMN "cod_prov" DROP NOT NULL`);
        await queryRunner.query(`CREATE SEQUENCE IF NOT EXISTS "provinces_ogc_fid_seq" OWNED BY "provinces"."ogc_fid"`);
        await queryRunner.query(`ALTER TABLE "provinces" ALTER COLUMN "ogc_fid" SET DEFAULT nextval('"provinces_ogc_fid_seq"')`);
        await queryRunner.query(`ALTER TABLE "provinces" DROP CONSTRAINT "PK_2e4260eedbcad036ec53222e0c7"`);
        await queryRunner.query(`ALTER TABLE "provinces" ADD CONSTRAINT "provinces_pkey" PRIMARY KEY ("ogc_fid", "id")`);
        await queryRunner.query(`ALTER TABLE "provinces" DROP CONSTRAINT "provinces_pkey"`);
        await queryRunner.query(`ALTER TABLE "provinces" ADD CONSTRAINT "provinces_pkey" PRIMARY KEY ("ogc_fid")`);
        await queryRunner.query(`ALTER TABLE "provinces" DROP COLUMN "id"`);
        await queryRunner.query(`CREATE INDEX "provinces_geom_geom_idx" ON "provinces" USING GiST ("geom") `);
    }

}
