import { MigrationInterface, QueryRunner } from "typeorm";

export class VehicleLocationNewType1776570380582 implements MigrationInterface {
    name = 'VehicleLocationNewType1776570380582'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "vehicle_entity" DROP COLUMN "lat"`);
        await queryRunner.query(`ALTER TABLE "vehicle_entity" ADD "lat" numeric(10,8) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "vehicle_entity" DROP COLUMN "lng"`);
        await queryRunner.query(`ALTER TABLE "vehicle_entity" ADD "lng" numeric(11,8) NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "vehicle_entity" DROP COLUMN "lng"`);
        await queryRunner.query(`ALTER TABLE "vehicle_entity" ADD "lng" integer NOT NULL`);
        await queryRunner.query(`ALTER TABLE "vehicle_entity" DROP COLUMN "lat"`);
        await queryRunner.query(`ALTER TABLE "vehicle_entity" ADD "lat" integer NOT NULL`);
    }

}
