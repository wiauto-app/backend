import { MigrationInterface, QueryRunner } from "typeorm";

export class Colors1777346754971 implements MigrationInterface {
    name = 'Colors1777346754971'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "colors" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "hex_code" character varying NOT NULL, "slug" character varying NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_3a62edc12d29307872ab1777ced" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "colors"`);
    }

}
