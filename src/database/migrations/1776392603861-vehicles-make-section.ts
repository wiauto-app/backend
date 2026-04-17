import { MigrationInterface, QueryRunner } from "typeorm";

export class VehiclesMakeSection1776392603861 implements MigrationInterface {
    name = 'VehiclesMakeSection1776392603861'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "make" ADD "section_1_id" integer NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "make" DROP COLUMN "section_1_id"`);
    }

}
