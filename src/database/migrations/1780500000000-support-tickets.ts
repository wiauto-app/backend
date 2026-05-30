import { MigrationInterface, QueryRunner } from "typeorm";

export class SupportTickets1780500000000 implements MigrationInterface {
  name = "SupportTickets1780500000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "ticket_categories" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying NOT NULL,
        "slug" character varying NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_ticket_categories_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_ticket_categories_name" UNIQUE ("name"),
        CONSTRAINT "UQ_ticket_categories_slug" UNIQUE ("slug")
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "public"."tickets_status_enum" AS ENUM(
        'open',
        'closed',
        'pending',
        'in_progress',
        'resolved',
        'cancelled'
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "tickets" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "title" character varying NOT NULL,
        "description" text NOT NULL,
        "file_url" character varying,
        "status" "public"."tickets_status_enum" NOT NULL DEFAULT 'open',
        "category_id" uuid NOT NULL,
        "profile_id" uuid NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_tickets_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_tickets_category_id" ON "tickets" ("category_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_tickets_profile_id" ON "tickets" ("profile_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_tickets_status" ON "tickets" ("status")
    `);

    await queryRunner.query(`
      ALTER TABLE "tickets"
      ADD CONSTRAINT "FK_tickets_category_id"
      FOREIGN KEY ("category_id") REFERENCES "ticket_categories"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "tickets"
      ADD CONSTRAINT "FK_tickets_profile_id"
      FOREIGN KEY ("profile_id") REFERENCES "profile"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "tickets" DROP CONSTRAINT "FK_tickets_profile_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tickets" DROP CONSTRAINT "FK_tickets_category_id"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_tickets_status"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_tickets_profile_id"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_tickets_category_id"`);
    await queryRunner.query(`DROP TABLE "tickets"`);
    await queryRunner.query(`DROP TYPE "public"."tickets_status_enum"`);
    await queryRunner.query(`DROP TABLE "ticket_categories"`);
  }
}
