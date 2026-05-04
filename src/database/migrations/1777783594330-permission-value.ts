import { MigrationInterface, QueryRunner } from "typeorm";

export class PermissionValue1777783594330 implements MigrationInterface {
    name = 'PermissionValue1777783594330'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "permissions" ADD "value" integer`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "permissions" DROP COLUMN "value"`);
    }

}
