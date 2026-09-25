import { MigrationInterface, QueryRunner } from "typeorm";

export class LeadAssistantContextNote5001790308365915 implements MigrationInterface {
  name = "LeadAssistantContextNote5001790308365915";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "lead_assistant_settings"
      ALTER COLUMN "context_note" TYPE character varying(500)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "lead_assistant_settings"
      SET "context_note" = LEFT("context_note", 100)
      WHERE char_length("context_note") > 100
    `);
    await queryRunner.query(`
      ALTER TABLE "lead_assistant_settings"
      ALTER COLUMN "context_note" TYPE character varying(100)
    `);
  }
}
