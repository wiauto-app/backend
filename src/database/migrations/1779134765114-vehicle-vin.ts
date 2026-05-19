import { MigrationInterface, QueryRunner } from "typeorm";

export class VehicleVin1779134765114 implements MigrationInterface {
    name = 'VehicleVin1779134765114'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "vehicles" ADD "vin_code" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "vehicles" DROP COLUMN "vin_code"`);
    }

}
