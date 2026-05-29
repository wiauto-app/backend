import { MigrationInterface, QueryRunner } from "typeorm";

export class ChatMessagingV21780000000000 implements MigrationInterface {
  name = "ChatMessagingV21780000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "public"."chat_messages_type_enum" ADD VALUE IF NOT EXISTS 'image'`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."chat_messages_type_enum" ADD VALUE IF NOT EXISTS 'file'`,
    );

    await queryRunner.query(
      `ALTER TABLE "chat_messages" ADD COLUMN IF NOT EXISTS "metadata" jsonb`,
    );
    await queryRunner.query(
      `ALTER TABLE "chat_messages" ADD COLUMN IF NOT EXISTS "edited_at" TIMESTAMP WITH TIME ZONE`,
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "chat_participant_state" (
        "chat_id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "last_read_message_id" uuid,
        "last_read_at" TIMESTAMP WITH TIME ZONE,
        "unread_count" integer NOT NULL DEFAULT 0,
        CONSTRAINT "PK_chat_participant_state" PRIMARY KEY ("chat_id", "user_id"),
        CONSTRAINT "FK_chat_participant_state_chat_id" FOREIGN KEY ("chat_id") REFERENCES "chats"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "FK_chat_participant_state_last_read_message_id" FOREIGN KEY ("last_read_message_id") REFERENCES "chat_messages"("id") ON DELETE SET NULL ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_chat_participant_state_user_id" ON "chat_participant_state" ("user_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_chat_participant_state_user_id"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "chat_participant_state"`);
    await queryRunner.query(`ALTER TABLE "chat_messages" DROP COLUMN IF EXISTS "edited_at"`);
    await queryRunner.query(`ALTER TABLE "chat_messages" DROP COLUMN IF EXISTS "metadata"`);
  }
}
