import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateGenericLeads1790500000000 implements MigrationInterface {
  name = "CreateGenericLeads1790500000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "generic_leads" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "type" character varying NOT NULL,
        "first_name" character varying NOT NULL,
        "last_name" character varying NOT NULL,
        "dni" character varying,
        "phone" character varying NOT NULL,
        "email" character varying NOT NULL,
        "extra_data" jsonb NOT NULL DEFAULT '{}',
        "status" character varying NOT NULL DEFAULT 'pending',
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_generic_leads_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_generic_leads_type" ON "generic_leads" ("type")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_generic_leads_type"`);
    await queryRunner.query(`DROP TABLE "generic_leads"`);
  }
}
