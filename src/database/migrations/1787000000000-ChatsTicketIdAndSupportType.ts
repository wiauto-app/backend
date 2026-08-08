import { MigrationInterface, QueryRunner } from "typeorm";

export class ChatsTicketIdAndSupportType1787000000000 implements MigrationInterface {
  name = "ChatsTicketIdAndSupportType1787000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "chats" ADD "ticket_id" uuid`);
    await queryRunner.query(
      `ALTER TABLE "chats" ADD CONSTRAINT "UQ_chats_ticket_id" UNIQUE ("ticket_id")`,
    );

    await queryRunner.query(
      `ALTER TYPE "public"."chats_chat_type_enum" RENAME TO "chats_chat_type_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."chats_chat_type_enum" AS ENUM('individual', 'group', 'support')`,
    );
    await queryRunner.query(
      `ALTER TABLE "chats" ALTER COLUMN "chat_type" TYPE "public"."chats_chat_type_enum" USING "chat_type"::"text"::"public"."chats_chat_type_enum"`,
    );
    await queryRunner.query(`DROP TYPE "public"."chats_chat_type_enum_old"`);

    await queryRunner.query(
      `ALTER TABLE "chats" ADD CONSTRAINT "FK_chats_ticket_id" FOREIGN KEY ("ticket_id") REFERENCES "tickets"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "chats" DROP CONSTRAINT "FK_chats_ticket_id"`,
    );

    await queryRunner.query(
      `CREATE TYPE "public"."chats_chat_type_enum_old" AS ENUM('individual', 'group')`,
    );
    await queryRunner.query(
      `ALTER TABLE "chats" ALTER COLUMN "chat_type" TYPE "public"."chats_chat_type_enum_old" USING "chat_type"::"text"::"public"."chats_chat_type_enum_old"`,
    );
    await queryRunner.query(`DROP TYPE "public"."chats_chat_type_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."chats_chat_type_enum_old" RENAME TO "chats_chat_type_enum"`,
    );

    await queryRunner.query(
      `ALTER TABLE "chats" DROP CONSTRAINT "UQ_chats_ticket_id"`,
    );
    await queryRunner.query(`ALTER TABLE "chats" DROP COLUMN "ticket_id"`);
  }
}
