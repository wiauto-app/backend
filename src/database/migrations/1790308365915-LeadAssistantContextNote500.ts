import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Amplía context_note a 500 caracteres cuando la tabla ya existe (p. ej. entornos
 * que aplicaron LeadAssistantSettings con varchar(100)). En producción la tabla
 * aún no existe: esta migración no hace nada y LeadAssistantSettings crea la
 * columna directamente con 500.
 */
export class LeadAssistantContextNote5001790308365915 implements MigrationInterface {
  name = "LeadAssistantContextNote5001790308365915";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1
          FROM information_schema.tables
          WHERE table_schema = 'public'
            AND table_name = 'lead_assistant_settings'
        ) THEN
          ALTER TABLE "lead_assistant_settings"
            ALTER COLUMN "context_note" TYPE character varying(500);
        END IF;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1
          FROM information_schema.tables
          WHERE table_schema = 'public'
            AND table_name = 'lead_assistant_settings'
        ) THEN
          UPDATE "lead_assistant_settings"
          SET "context_note" = LEFT("context_note", 100)
          WHERE char_length("context_note") > 100;

          ALTER TABLE "lead_assistant_settings"
            ALTER COLUMN "context_note" TYPE character varying(100);
        END IF;
      END $$;
    `);
  }
}
