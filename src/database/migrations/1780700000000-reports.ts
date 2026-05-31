import { MigrationInterface, QueryRunner } from "typeorm";

export class Reports1780700000000 implements MigrationInterface {
  name = "Reports1780700000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "public"."report_categories_target_type_enum" AS ENUM(
        'profile',
        'dealership',
        'vehicle'
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "report_categories" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying NOT NULL,
        "slug" character varying NOT NULL,
        "target_type" "public"."report_categories_target_type_enum" NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_report_categories_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_report_categories_slug_target_type" UNIQUE ("slug", "target_type"),
        CONSTRAINT "UQ_report_categories_name_target_type" UNIQUE ("name", "target_type")
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "public"."reports_status_enum" AS ENUM(
        'open',
        'in_review',
        'resolved',
        'dismissed',
        'escalated'
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "public"."reports_target_type_enum" AS ENUM(
        'profile',
        'dealership',
        'vehicle'
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "reports" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "title" character varying NOT NULL,
        "description" text NOT NULL,
        "file_url" character varying,
        "status" "public"."reports_status_enum" NOT NULL DEFAULT 'open',
        "category_id" uuid NOT NULL,
        "reporter_profile_id" uuid NOT NULL,
        "target_type" "public"."reports_target_type_enum" NOT NULL,
        "target_profile_id" uuid,
        "target_dealership_id" uuid,
        "target_vehicle_id" uuid,
        "admin_notes" text,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_reports_id" PRIMARY KEY ("id"),
        CONSTRAINT "CHK_reports_target_fks" CHECK (
          (
            "target_type" = 'profile'
            AND "target_profile_id" IS NOT NULL
            AND "target_dealership_id" IS NULL
            AND "target_vehicle_id" IS NULL
          )
          OR (
            "target_type" = 'dealership'
            AND "target_dealership_id" IS NOT NULL
            AND "target_profile_id" IS NULL
            AND "target_vehicle_id" IS NULL
          )
          OR (
            "target_type" = 'vehicle'
            AND "target_vehicle_id" IS NOT NULL
            AND "target_profile_id" IS NULL
            AND "target_dealership_id" IS NULL
          )
        )
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_reports_category_id" ON "reports" ("category_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_reports_reporter_profile_id" ON "reports" ("reporter_profile_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_reports_target_type_status" ON "reports" ("target_type", "status")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_reports_target_profile_id" ON "reports" ("target_profile_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_reports_target_dealership_id" ON "reports" ("target_dealership_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_reports_target_vehicle_id" ON "reports" ("target_vehicle_id")
    `);

    await queryRunner.query(`
      ALTER TABLE "reports"
      ADD CONSTRAINT "FK_reports_category_id"
      FOREIGN KEY ("category_id") REFERENCES "report_categories"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "reports"
      ADD CONSTRAINT "FK_reports_reporter_profile_id"
      FOREIGN KEY ("reporter_profile_id") REFERENCES "profile"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "reports"
      ADD CONSTRAINT "FK_reports_target_profile_id"
      FOREIGN KEY ("target_profile_id") REFERENCES "profile"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "reports"
      ADD CONSTRAINT "FK_reports_target_dealership_id"
      FOREIGN KEY ("target_dealership_id") REFERENCES "dealerships"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "reports"
      ADD CONSTRAINT "FK_reports_target_vehicle_id"
      FOREIGN KEY ("target_vehicle_id") REFERENCES "vehicles"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "reports" DROP CONSTRAINT "FK_reports_target_vehicle_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "reports" DROP CONSTRAINT "FK_reports_target_dealership_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "reports" DROP CONSTRAINT "FK_reports_target_profile_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "reports" DROP CONSTRAINT "FK_reports_reporter_profile_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "reports" DROP CONSTRAINT "FK_reports_category_id"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_reports_target_vehicle_id"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_reports_target_dealership_id"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_reports_target_profile_id"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_reports_target_type_status"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_reports_reporter_profile_id"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_reports_category_id"`);
    await queryRunner.query(`DROP TABLE "reports"`);
    await queryRunner.query(`DROP TYPE "public"."reports_target_type_enum"`);
    await queryRunner.query(`DROP TYPE "public"."reports_status_enum"`);
    await queryRunner.query(`DROP TABLE "report_categories"`);
    await queryRunner.query(
      `DROP TYPE "public"."report_categories_target_type_enum"`,
    );
  }
}
