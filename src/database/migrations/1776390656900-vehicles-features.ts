import { MigrationInterface, QueryRunner } from "typeorm";

export class VehiclesFeatures1776390656900 implements MigrationInterface {
    name = 'VehiclesFeatures1776390656900'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."communities_geom_geom_idx"`);
        await queryRunner.query(`CREATE TABLE "model" ("id" SERIAL NOT NULL, "make_id" integer NOT NULL, "model_id" integer NOT NULL, "name" character varying NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_d6df271bba301d5cc79462912a4" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "make" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_d4a8ffcef42ddddbe1c38b6e39b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "body_type" ("id" SERIAL NOT NULL, "body_type_id" integer NOT NULL, "doors" integer NOT NULL, "name" character varying NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_34a2e4574f19c9be295e3310879" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "fuel_type" ("id" SERIAL NOT NULL, "fuel_id" integer NOT NULL, "name" character varying NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_546a28980794b5335ca804e76d8" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "version" ("id" SERIAL NOT NULL, "make_id" integer NOT NULL, "model_id" integer NOT NULL, "body_type_id" integer NOT NULL, "fuel_type_id" integer NOT NULL, "year_id" integer NOT NULL, "name" character varying NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_4fb5fbb15a43da9f35493107b1d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "year" ("id" SERIAL NOT NULL, "year" integer NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_506885a7430147dbff28fa689fd" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "communities" DROP COLUMN "created_at"`);
        await queryRunner.query(`ALTER TABLE "communities" DROP COLUMN "updated_at"`);
        await queryRunner.query(`ALTER TABLE "communities" ADD "id" SERIAL NOT NULL`);
        await queryRunner.query(`ALTER TABLE "communities" DROP CONSTRAINT "communities_pkey"`);
        await queryRunner.query(`ALTER TABLE "communities" ADD CONSTRAINT "communities_pkey" PRIMARY KEY ("ogc_fid", "id")`);
        await queryRunner.query(`ALTER TABLE "communities" DROP CONSTRAINT "communities_pkey"`);
        await queryRunner.query(`ALTER TABLE "communities" ADD CONSTRAINT "PK_fea1fe83c86ccde9d0a089e7ea2" PRIMARY KEY ("id")`);
        await queryRunner.query(`ALTER TABLE "communities" ALTER COLUMN "ogc_fid" DROP DEFAULT`);
        await queryRunner.query(`DROP SEQUENCE "communities_ogc_fid_seq"`);
        await queryRunner.query(`ALTER TABLE "communities" ALTER COLUMN "cod_ccaa" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "communities" ALTER COLUMN "geom" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "model" ADD CONSTRAINT "FK_4912a41adf7e3392e4932f7c90d" FOREIGN KEY ("make_id") REFERENCES "make"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "version" ADD CONSTRAINT "FK_b2648854ed86bd3c4bee54c35bd" FOREIGN KEY ("make_id") REFERENCES "make"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "version" ADD CONSTRAINT "FK_7db01f71d52bcd8b1da81665b2f" FOREIGN KEY ("model_id") REFERENCES "model"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "version" ADD CONSTRAINT "FK_97fcbf2eb463f0c57dd7ef4c9cd" FOREIGN KEY ("body_type_id") REFERENCES "body_type"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "version" ADD CONSTRAINT "FK_1fc11da3472768e1bae4ab53c0e" FOREIGN KEY ("fuel_type_id") REFERENCES "fuel_type"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "version" ADD CONSTRAINT "FK_ea89bd79b001732db2c5111c068" FOREIGN KEY ("year_id") REFERENCES "year"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "version" DROP CONSTRAINT "FK_ea89bd79b001732db2c5111c068"`);
        await queryRunner.query(`ALTER TABLE "version" DROP CONSTRAINT "FK_1fc11da3472768e1bae4ab53c0e"`);
        await queryRunner.query(`ALTER TABLE "version" DROP CONSTRAINT "FK_97fcbf2eb463f0c57dd7ef4c9cd"`);
        await queryRunner.query(`ALTER TABLE "version" DROP CONSTRAINT "FK_7db01f71d52bcd8b1da81665b2f"`);
        await queryRunner.query(`ALTER TABLE "version" DROP CONSTRAINT "FK_b2648854ed86bd3c4bee54c35bd"`);
        await queryRunner.query(`ALTER TABLE "model" DROP CONSTRAINT "FK_4912a41adf7e3392e4932f7c90d"`);
        await queryRunner.query(`ALTER TABLE "communities" ALTER COLUMN "geom" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "communities" ALTER COLUMN "cod_ccaa" DROP NOT NULL`);
        await queryRunner.query(`CREATE SEQUENCE IF NOT EXISTS "communities_ogc_fid_seq" OWNED BY "communities"."ogc_fid"`);
        await queryRunner.query(`ALTER TABLE "communities" ALTER COLUMN "ogc_fid" SET DEFAULT nextval('"communities_ogc_fid_seq"')`);
        await queryRunner.query(`ALTER TABLE "communities" DROP CONSTRAINT "PK_fea1fe83c86ccde9d0a089e7ea2"`);
        await queryRunner.query(`ALTER TABLE "communities" ADD CONSTRAINT "communities_pkey" PRIMARY KEY ("ogc_fid", "id")`);
        await queryRunner.query(`ALTER TABLE "communities" DROP CONSTRAINT "communities_pkey"`);
        await queryRunner.query(`ALTER TABLE "communities" ADD CONSTRAINT "communities_pkey" PRIMARY KEY ("ogc_fid")`);
        await queryRunner.query(`ALTER TABLE "communities" DROP COLUMN "id"`);
        await queryRunner.query(`ALTER TABLE "communities" ADD "updated_at" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`ALTER TABLE "communities" ADD "created_at" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`DROP TABLE "year"`);
        await queryRunner.query(`DROP TABLE "version"`);
        await queryRunner.query(`DROP TABLE "fuel_type"`);
        await queryRunner.query(`DROP TABLE "body_type"`);
        await queryRunner.query(`DROP TABLE "make"`);
        await queryRunner.query(`DROP TABLE "model"`);
        await queryRunner.query(`CREATE INDEX "communities_geom_geom_idx" ON "communities" USING GiST ("geom") `);
    }

}
