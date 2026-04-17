import { MigrationInterface, QueryRunner } from "typeorm";

export class Municipalities1776381542977 implements MigrationInterface {
    name = 'Municipalities1776381542977'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "municipalities" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "ineCode" character varying NOT NULL, "nuts1" character varying NOT NULL, "nuts2" character varying NOT NULL, "nuts3" character varying NOT NULL, "geom" geometry(MultiPolygon,4326) NOT NULL, CONSTRAINT "PK_9c4573349577306f221dda4d924" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "municipalities"`);
    }

}
