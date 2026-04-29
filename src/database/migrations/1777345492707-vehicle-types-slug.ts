import { MigrationInterface, QueryRunner } from "typeorm";

export class VehicleTypesSlug1777345492707 implements MigrationInterface {
    name = 'VehicleTypesSlug1777345492707'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "vehicle_types" ADD "slug" character varying NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "vehicle_types" DROP COLUMN "slug"`);
    }

}
