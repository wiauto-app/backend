import { MigrationInterface, QueryRunner } from "typeorm";

export class VersionId1776571514893 implements MigrationInterface {
    name = 'VersionId1776571514893'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "vehicle_entity" ADD "version_id" integer NOT NULL`);
        await queryRunner.query(`ALTER TABLE "vehicle_entity" ADD CONSTRAINT "FK_d08f1ddb492891a99e6cb1db743" FOREIGN KEY ("version_id") REFERENCES "version"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "vehicle_entity" DROP CONSTRAINT "FK_d08f1ddb492891a99e6cb1db743"`);
        await queryRunner.query(`ALTER TABLE "vehicle_entity" DROP COLUMN "version_id"`);
    }

}
