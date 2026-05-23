import { MigrationInterface, QueryRunner } from "typeorm";

export class LocationNumeric1779561587930 implements MigrationInterface {
    name = 'LocationNumeric1779561587930'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "vehicles" ALTER COLUMN "lat" TYPE numeric`);
        await queryRunner.query(`ALTER TABLE "vehicles" ALTER COLUMN "lng" TYPE numeric`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "vehicles" ALTER COLUMN "lng" TYPE numeric(11,8)`);
        await queryRunner.query(`ALTER TABLE "vehicles" ALTER COLUMN "lat" TYPE numeric(10,8)`);
    }

}
