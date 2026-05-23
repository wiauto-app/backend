import { MigrationInterface, QueryRunner } from "typeorm";

export class PowerNumeric1779563229311 implements MigrationInterface {
    name = 'PowerNumeric1779563229311'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "vehicles" DROP COLUMN "power"`);
        await queryRunner.query(`ALTER TABLE "vehicles" ADD "power" numeric`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "vehicles" DROP COLUMN "power"`);
        await queryRunner.query(`ALTER TABLE "vehicles" ADD "power" integer NOT NULL`);
    }

}
