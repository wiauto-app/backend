import { MigrationInterface, QueryRunner } from "typeorm";

export class AssistantConversations1782100000000 implements MigrationInterface {
  name = "AssistantConversations1782100000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "assistant_conversations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "title" character varying(60) NOT NULL, "messages" jsonb NOT NULL DEFAULT '[]', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_assistant_conversations_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_assistant_conversations_user_id" ON "assistant_conversations" ("user_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "assistant_conversations" ADD CONSTRAINT "FK_assistant_conversations_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "assistant_conversations" DROP CONSTRAINT "FK_assistant_conversations_user_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_assistant_conversations_user_id"`,
    );
    await queryRunner.query(`DROP TABLE "assistant_conversations"`);
  }
}
