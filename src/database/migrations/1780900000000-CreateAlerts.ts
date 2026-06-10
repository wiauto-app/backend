import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateAlerts1780900000000 implements MigrationInterface {
  name = "CreateAlerts1780900000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "alerts" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "profile_id" uuid NOT NULL,
        "email" character varying NOT NULL,
        "phone" character varying NOT NULL,
        "phone_code" character varying NOT NULL,
        "filters" jsonb NOT NULL,
        "last_sent_at" TIMESTAMP,
        CONSTRAINT "PK_alerts_id" PRIMARY KEY ("id")
      )`,
    );
    await queryRunner.query(
      `ALTER TABLE "alerts" ADD CONSTRAINT "FK_alerts_profile_id" FOREIGN KEY ("profile_id") REFERENCES "profile"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "alerts" DROP CONSTRAINT "FK_alerts_profile_id"`,
    );
    await queryRunner.query(`DROP TABLE "alerts"`);
  }
}
