import { MigrationInterface, QueryRunner } from "typeorm";

export class VehicleStatus1776570486968 implements MigrationInterface {
    name = 'VehicleStatus1776570486968'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "vehicle_entity" DROP COLUMN "status"`);
        await queryRunner.query(`CREATE TYPE "public"."vehicle_entity_status_enum" AS ENUM('active', 'pending', 'inactive', 'sold', 'archived')`);
        await queryRunner.query(`ALTER TABLE "vehicle_entity" ADD "status" "public"."vehicle_entity_status_enum" NOT NULL DEFAULT 'pending'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "vehicle_entity" DROP COLUMN "status"`);
        await queryRunner.query(`DROP TYPE "public"."vehicle_entity_status_enum"`);
        await queryRunner.query(`ALTER TABLE "vehicle_entity" ADD "status" character varying NOT NULL`);
    }

}
