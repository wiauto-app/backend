import { MigrationInterface, QueryRunner } from "typeorm";

export class CreatePlanContactLeads1788894778507 implements MigrationInterface {
  name = "CreatePlanContactLeads1788894778507";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."plan_contact_lead_status_enum" AS ENUM('pending', 'contacted', 'closed')`,
    );
    await queryRunner.query(
      `CREATE TABLE "plan_contact_leads" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "phone" character varying NOT NULL, "source" character varying NOT NULL DEFAULT 'planes', "status" "public"."plan_contact_lead_status_enum" NOT NULL DEFAULT 'pending', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_b147b8202d0290871723f863523" PRIMARY KEY ("id"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "plan_contact_leads"`);
    await queryRunner.query(
      `DROP TYPE "public"."plan_contact_lead_status_enum"`,
    );
  }
}
