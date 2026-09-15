import { MigrationInterface, QueryRunner } from "typeorm";

export class AllowGuestSupportTickets1790000000000
  implements MigrationInterface
{
  name = "AllowGuestSupportTickets1790000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "tickets" ADD "guest_name" character varying(120)`,
    );
    await queryRunner.query(
      `ALTER TABLE "tickets" ADD "guest_email" character varying(254)`,
    );
    await queryRunner.query(
      `ALTER TABLE "tickets" ALTER COLUMN "profile_id" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "tickets" DROP CONSTRAINT "FK_fbcb5e6bcbf6e847e82e9cfd838"`,
    );
    await queryRunner.query(`
      ALTER TABLE "tickets"
      ADD CONSTRAINT "FK_fbcb5e6bcbf6e847e82e9cfd838"
      FOREIGN KEY ("profile_id") REFERENCES "profile"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "tickets"
      ADD CONSTRAINT "CHK_tickets_requester"
      CHECK (
        "profile_id" IS NOT NULL
        OR ("guest_name" IS NOT NULL AND "guest_email" IS NOT NULL)
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "tickets" DROP CONSTRAINT "CHK_tickets_requester"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tickets" DROP CONSTRAINT "FK_fbcb5e6bcbf6e847e82e9cfd838"`,
    );
    await queryRunner.query(`DELETE FROM "tickets" WHERE "profile_id" IS NULL`);
    await queryRunner.query(
      `ALTER TABLE "tickets" ALTER COLUMN "profile_id" SET NOT NULL`,
    );
    await queryRunner.query(`
      ALTER TABLE "tickets"
      ADD CONSTRAINT "FK_fbcb5e6bcbf6e847e82e9cfd838"
      FOREIGN KEY ("profile_id") REFERENCES "profile"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);
    await queryRunner.query(`ALTER TABLE "tickets" DROP COLUMN "guest_email"`);
    await queryRunner.query(`ALTER TABLE "tickets" DROP COLUMN "guest_name"`);
  }
}
