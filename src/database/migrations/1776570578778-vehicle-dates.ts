import { MigrationInterface, QueryRunner } from "typeorm";

export class VehicleDates1776570578778 implements MigrationInterface {
    name = 'VehicleDates1776570578778'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "vehicle_entity" ALTER COLUMN "is_featured" SET DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "vehicle_entity" ALTER COLUMN "created_at" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "vehicle_entity" ALTER COLUMN "updated_at" SET DEFAULT now()`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "vehicle_entity" ALTER COLUMN "updated_at" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "vehicle_entity" ALTER COLUMN "created_at" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "vehicle_entity" ALTER COLUMN "is_featured" DROP DEFAULT`);
    }

}
