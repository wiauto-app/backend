import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateProfessionalAccounts1788458558796 implements MigrationInterface {
  name = "CreateProfessionalAccounts1788458558796";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."professional_account_type_enum" AS ENUM('self_employed', 'company')`,
    );
    await queryRunner.query(`
      CREATE TABLE "professional_accounts" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "profile_id" uuid NOT NULL,
        "type" "public"."professional_account_type_enum" NOT NULL,
        "legal_name" character varying NOT NULL,
        "commercial_name" character varying,
        "tax_id" character varying NOT NULL,
        "stripe_customer_id" character varying,
        "accepted_terms_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_161314faebff2c4aaa0f797b150" UNIQUE ("profile_id"),
        CONSTRAINT "PK_2d0f2486785a9635c890a1bc7fd" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      ALTER TABLE "professional_accounts"
      ADD CONSTRAINT "FK_professional_accounts_profile"
      FOREIGN KEY ("profile_id") REFERENCES "profile"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "professional_accounts" DROP CONSTRAINT "FK_professional_accounts_profile"`,
    );
    await queryRunner.query(`DROP TABLE "professional_accounts"`);
    await queryRunner.query(
      `DROP TYPE "public"."professional_account_type_enum"`,
    );
  }
}
