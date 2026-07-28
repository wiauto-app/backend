import { MigrationInterface, QueryRunner } from "typeorm";

export class AppraisalRequests1784800000000 implements MigrationInterface {
  name = "AppraisalRequests1784800000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "appraisal_requests_status_enum" AS ENUM ('pending', 'answered', 'closed')
    `);
    await queryRunner.query(`
      CREATE TYPE "appraisal_requests_transmission_type_enum" AS ENUM ('manual', 'automatic')
    `);

    await queryRunner.query(`
      CREATE TABLE "appraisal_requests" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "make_id" integer NOT NULL,
        "model_id" integer NOT NULL,
        "year_id" integer NOT NULL,
        "version_id" integer,
        "fuel_type_id" integer,
        "body_type_id" integer,
        "transmission_type" "appraisal_requests_transmission_type_enum" NOT NULL,
        "mileage" integer NOT NULL,
        "lat" numeric NOT NULL,
        "lng" numeric NOT NULL,
        "address" text,
        "name" character varying NOT NULL,
        "email" character varying NOT NULL,
        "phone_code" character varying NOT NULL,
        "phone" character varying NOT NULL,
        "status" "appraisal_requests_status_enum" NOT NULL DEFAULT 'pending',
        "estimated_price_min" numeric,
        "estimated_price_max" numeric,
        "admin_note" text,
        "answered_at" TIMESTAMP,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_appraisal_requests" PRIMARY KEY ("id"),
        CONSTRAINT "FK_appraisal_requests_make_id" FOREIGN KEY ("make_id") REFERENCES "make"("id"),
        CONSTRAINT "FK_appraisal_requests_model_id" FOREIGN KEY ("model_id") REFERENCES "model"("id"),
        CONSTRAINT "FK_appraisal_requests_year_id" FOREIGN KEY ("year_id") REFERENCES "year"("id"),
        CONSTRAINT "FK_appraisal_requests_version_id" FOREIGN KEY ("version_id") REFERENCES "version"("id") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_appraisal_requests_status" ON "appraisal_requests" ("status")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_appraisal_requests_status"`);
    await queryRunner.query(`DROP TABLE "appraisal_requests"`);
    await queryRunner.query(`DROP TYPE "appraisal_requests_transmission_type_enum"`);
    await queryRunner.query(`DROP TYPE "appraisal_requests_status_enum"`);
  }
}
