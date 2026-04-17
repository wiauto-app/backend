import { MigrationInterface, QueryRunner } from "typeorm";

export class Comunity1776386821582 implements MigrationInterface {
    name = 'Comunity1776386821582'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "communities" ("id" SERIAL NOT NULL, "ogc_fid" integer NOT NULL, "cod_ccaa" character varying NOT NULL, "noml_ccaa" character varying, "name" character varying, "cartodb_id" integer, "geom" geometry(MultiPolygon,4326) NOT NULL, CONSTRAINT "PK_fea1fe83c86ccde9d0a089e7ea2" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "communities"`);
    }

}
