import { MigrationInterface, QueryRunner } from "typeorm";

export class Vehicle1776570073349 implements MigrationInterface {
    name = 'Vehicle1776570073349'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "vehicle_entity" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "price" integer NOT NULL, "mileage" integer NOT NULL, "lat" integer NOT NULL, "lng" integer NOT NULL, "condition" character varying NOT NULL, "title" character varying NOT NULL, "description" character varying NOT NULL, "status" character varying NOT NULL, "is_featured" boolean NOT NULL, "expires_at" TIMESTAMP NOT NULL, "views" integer NOT NULL, "created_at" TIMESTAMP NOT NULL, "updated_at" TIMESTAMP NOT NULL, CONSTRAINT "PK_901cac34c94a50c311650bc5ad5" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "vehicle_entity"`);
    }

}
