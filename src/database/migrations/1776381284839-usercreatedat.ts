import { MigrationInterface, QueryRunner } from "typeorm";

export class Usercreatedat1776381284839 implements MigrationInterface {
    name = 'Usercreatedat1776381284839'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" ADD "created_at" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "profile" ADD "avatar_url" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "profile" ADD "image_url" character varying NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "profile" DROP COLUMN "image_url"`);
        await queryRunner.query(`ALTER TABLE "profile" DROP COLUMN "avatar_url"`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "created_at"`);
    }

}
