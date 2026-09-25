import { MigrationInterface, QueryRunner } from "typeorm";

export class LeadScoringAndAiReplyColumns1791200000000 implements MigrationInterface {
  name = "LeadScoringAndAiReplyColumns1791200000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "leads" ADD "chat_id" uuid`);
    await queryRunner.query(`ALTER TABLE "leads" ADD "ai_replied_at" TIMESTAMP WITH TIME ZONE`);
    await queryRunner.query(`ALTER TABLE "leads" ADD "ai_reply_channel" character varying(16)`);
    await queryRunner.query(`ALTER TABLE "leads" ADD "score" integer NOT NULL DEFAULT '0'`);
    await queryRunner.query(
      `ALTER TABLE "leads" ADD "tier" character varying(8) NOT NULL DEFAULT 'cold'`,
    );
    await queryRunner.query(`ALTER TABLE "leads" ADD "score_signals" jsonb NOT NULL DEFAULT '[]'`);
    await queryRunner.query(`ALTER TABLE "leads" ADD "scored_at" TIMESTAMP WITH TIME ZONE`);
    await queryRunner.query(`CREATE INDEX "IDX_leads_chat_id" ON "leads" ("chat_id") `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_leads_chat_id"`);
    await queryRunner.query(`ALTER TABLE "leads" DROP COLUMN "scored_at"`);
    await queryRunner.query(`ALTER TABLE "leads" DROP COLUMN "score_signals"`);
    await queryRunner.query(`ALTER TABLE "leads" DROP COLUMN "tier"`);
    await queryRunner.query(`ALTER TABLE "leads" DROP COLUMN "score"`);
    await queryRunner.query(`ALTER TABLE "leads" DROP COLUMN "ai_reply_channel"`);
    await queryRunner.query(`ALTER TABLE "leads" DROP COLUMN "ai_replied_at"`);
    await queryRunner.query(`ALTER TABLE "leads" DROP COLUMN "chat_id"`);
  }
}
