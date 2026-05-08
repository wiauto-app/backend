import { MigrationInterface, QueryRunner } from "typeorm";

export class Invitations1778267125720 implements MigrationInterface {
    name = 'Invitations1778267125720'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "dealership_invitations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying NOT NULL, "role" character varying NOT NULL, "token_hash" character varying NOT NULL, "status" character varying NOT NULL, "expires_at" TIMESTAMP NOT NULL, "accepted_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "dealership_id" uuid NOT NULL, "invited_by_id" uuid NOT NULL, CONSTRAINT "UQ_97e91aa092b3a3a7da2fee275f7" UNIQUE ("token_hash"), CONSTRAINT "PK_f7ca39708ce5a40a1afc223d6b1" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_97e91aa092b3a3a7da2fee275f" ON "dealership_invitations" ("token_hash") `);
        await queryRunner.query(`ALTER TABLE "dealership_invitations" ADD CONSTRAINT "FK_69c2aa027558e6540d4e136a751" FOREIGN KEY ("invited_by_id") REFERENCES "profile"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "dealership_invitations" ADD CONSTRAINT "FK_f3a81a4a5f3b58705734b5ebea2" FOREIGN KEY ("dealership_id") REFERENCES "dealerships"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "dealership_invitations" DROP CONSTRAINT "FK_f3a81a4a5f3b58705734b5ebea2"`);
        await queryRunner.query(`ALTER TABLE "dealership_invitations" DROP CONSTRAINT "FK_69c2aa027558e6540d4e136a751"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_97e91aa092b3a3a7da2fee275f"`);
        await queryRunner.query(`DROP TABLE "dealership_invitations"`);
    }

}
