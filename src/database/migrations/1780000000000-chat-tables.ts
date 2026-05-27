import { MigrationInterface, QueryRunner } from "typeorm";

export class ChatTables1780000000000 implements MigrationInterface {
  name = "ChatTables1780000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."chats_chat_type_enum" AS ENUM('individual', 'group')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."chat_messages_type_enum" AS ENUM('text', 'audio')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."chat_messages_status_enum" AS ENUM('pending', 'sent', 'delivered', 'read')`,
    );

    await queryRunner.query(
      `CREATE TABLE "chats" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "participants" jsonb NOT NULL DEFAULT '[]', "chat_type" "public"."chats_chat_type_enum" NOT NULL, "vehicle_id" uuid NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_chats_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_chats_participants" ON "chats" USING GIN ("participants")`,
    );
    await queryRunner.query(
      `ALTER TABLE "chats" ADD CONSTRAINT "FK_chats_vehicle_id" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );

    await queryRunner.query(
      `CREATE TABLE "chat_messages" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "chat_id" uuid NOT NULL, "sender_id" uuid NOT NULL, "content" text NOT NULL, "type" "public"."chat_messages_type_enum" NOT NULL, "status" "public"."chat_messages_status_enum" NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "PK_chat_messages_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_chat_messages_chat_id" ON "chat_messages" ("chat_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_chat_messages_sender_id" ON "chat_messages" ("sender_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "chat_messages" ADD CONSTRAINT "FK_chat_messages_chat_id" FOREIGN KEY ("chat_id") REFERENCES "chats"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "chat_messages" DROP CONSTRAINT "FK_chat_messages_chat_id"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_chat_messages_sender_id"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_chat_messages_chat_id"`);
    await queryRunner.query(`DROP TABLE "chat_messages"`);

    await queryRunner.query(`ALTER TABLE "chats" DROP CONSTRAINT "FK_chats_vehicle_id"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_chats_participants"`);
    await queryRunner.query(`DROP TABLE "chats"`);

    await queryRunner.query(`DROP TYPE "public"."chat_messages_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."chat_messages_type_enum"`);
    await queryRunner.query(`DROP TYPE "public"."chats_chat_type_enum"`);
  }
}

