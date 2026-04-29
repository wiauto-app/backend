import { MigrationInterface, QueryRunner } from "typeorm";

export class DgtLabels1778070000000 implements MigrationInterface {
  name = "DgtLabels1778070000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "dgt_labels" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "code" character varying NOT NULL, "description" text NOT NULL, "slug" character varying NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_dgt_labels_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "dgt_labels" ADD CONSTRAINT "UQ_dgt_labels_code" UNIQUE ("code")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "dgt_labels" DROP CONSTRAINT "UQ_dgt_labels_code"`,
    );
    await queryRunner.query(`DROP TABLE "dgt_labels"`);
  }
}
