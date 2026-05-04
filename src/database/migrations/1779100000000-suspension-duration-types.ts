import { MigrationInterface, QueryRunner } from "typeorm";

export class SuspensionDurationTypes1779100000000 implements MigrationInterface {
  name = "SuspensionDurationTypes1779100000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "suspension_duration_types" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "key" character varying NOT NULL,
        "label" character varying NOT NULL,
        "duration_ms" bigint,
        "is_active" boolean NOT NULL DEFAULT true,
        "sort_order" integer NOT NULL DEFAULT 0,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_suspension_duration_types_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_suspension_duration_types_key" UNIQUE ("key")
      )
    `);

    await queryRunner.query(`
      INSERT INTO "suspension_duration_types" ("key", "label", "duration_ms", "is_active", "sort_order")
      SELECT x.key, x.label, x.duration_ms, true, x.sort_order
      FROM (
        VALUES
          ('day', 'Un día', (86400000)::bigint, 0),
          ('week', 'Una semana', (604800000)::bigint, 1),
          ('month', 'Un mes (30 días)', (2592000000)::bigint, 2),
          ('year', 'Un año (365 días)', (31536000000)::bigint, 3),
          ('indefinite', 'Indefinida (hasta levantar manualmente)', NULL::bigint, 4)
      ) AS x(key, label, duration_ms, sort_order)
      WHERE NOT EXISTS (SELECT 1 FROM "suspension_duration_types" s WHERE s.key = x.key)
    `);

    await queryRunner.query(`
      ALTER TABLE "users"
      ADD "suspension_duration_type_id" uuid
    `);
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD CONSTRAINT "FK_users_suspension_duration_type"
      FOREIGN KEY ("suspension_duration_type_id") REFERENCES "suspension_duration_types"("id")
      ON DELETE SET NULL ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "FK_users_suspension_duration_type"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN "suspension_duration_type_id"`,
    );
    await queryRunner.query(`DROP TABLE "suspension_duration_types"`);
  }
}
