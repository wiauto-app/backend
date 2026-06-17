import { MigrationInterface, QueryRunner } from "typeorm";

export class NewProfileFields1781708256765 implements MigrationInterface {
    name = 'NewProfileFields1781708256765'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "profile" ADD "dni" character varying`);
        await queryRunner.query(`ALTER TABLE "profile" ADD "phone_code" character varying`);
        await queryRunner.query(`ALTER TABLE "profile" ADD "phone" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "profile" DROP COLUMN "phone"`);
        await queryRunner.query(`ALTER TABLE "profile" DROP COLUMN "phone_code"`);
        await queryRunner.query(`ALTER TABLE "profile" DROP COLUMN "dni"`);
    }

}
