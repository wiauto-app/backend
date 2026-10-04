import { MigrationInterface, QueryRunner } from "typeorm";

export class AddVehiclesProfileIdIndex1791090349440 implements MigrationInterface {
    name = 'AddVehiclesProfileIdIndex1791090349440'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE INDEX "IDX_vehicles_profile_id" ON "vehicles" ("profile_id") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_vehicles_profile_id"`);
    }
}
