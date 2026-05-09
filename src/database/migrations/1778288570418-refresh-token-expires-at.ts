import { MigrationInterface, QueryRunner } from "typeorm";

export class RefreshTokenExpiresAt1778288570418 implements MigrationInterface {
    name = 'RefreshTokenExpiresAt1778288570418'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "refresh_tokens" ADD "expires_at" TIMESTAMP NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "refresh_tokens" DROP COLUMN "expires_at"`);
    }

}
