import { MigrationInterface, QueryRunner } from "typeorm";

export class PlanAccessGrants1787200000000 implements MigrationInterface {
  name = "PlanAccessGrants1787200000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "plan_access_grants" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "profile_id" uuid NOT NULL,
        "plan_id" uuid NOT NULL,
        "plan_version_id" uuid NOT NULL,
        "granted_by_user_id" uuid NOT NULL,
        "revoked_by_user_id" uuid,
        "reason" text,
        "expires_at" TIMESTAMP,
        "revoked_at" TIMESTAMP,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_plan_access_grants" PRIMARY KEY ("id"),
        CONSTRAINT "FK_plan_access_grants_profile"
          FOREIGN KEY ("profile_id") REFERENCES "profile"("id")
          ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "FK_plan_access_grants_plan"
          FOREIGN KEY ("plan_id") REFERENCES "subscription_plans"("id")
          ON DELETE RESTRICT ON UPDATE NO ACTION,
        CONSTRAINT "FK_plan_access_grants_plan_version"
          FOREIGN KEY ("plan_version_id") REFERENCES "plan_versions"("id")
          ON DELETE RESTRICT ON UPDATE NO ACTION,
        CONSTRAINT "FK_plan_access_grants_granted_by"
          FOREIGN KEY ("granted_by_user_id") REFERENCES "users"("id")
          ON DELETE RESTRICT ON UPDATE NO ACTION,
        CONSTRAINT "FK_plan_access_grants_revoked_by"
          FOREIGN KEY ("revoked_by_user_id") REFERENCES "users"("id")
          ON DELETE SET NULL ON UPDATE NO ACTION
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_plan_access_grants_one_current_per_profile"
      ON "plan_access_grants" ("profile_id")
      WHERE "revoked_at" IS NULL
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_plan_access_grants_active_lookup"
      ON "plan_access_grants" ("profile_id", "expires_at")
      WHERE "revoked_at" IS NULL
    `);

    await queryRunner.query(`
      CREATE TABLE "plan_access_grant_usage" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "grant_id" uuid NOT NULL,
        "feature" character varying NOT NULL,
        "period_start" TIMESTAMP NOT NULL,
        "period_end" TIMESTAMP NOT NULL,
        "used" integer NOT NULL DEFAULT 0,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_plan_access_grant_usage_feature_period"
          UNIQUE ("grant_id", "feature", "period_start"),
        CONSTRAINT "PK_plan_access_grant_usage" PRIMARY KEY ("id"),
        CONSTRAINT "FK_plan_access_grant_usage_grant"
          FOREIGN KEY ("grant_id") REFERENCES "plan_access_grants"("id")
          ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "plan_access_grant_usage"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_plan_access_grants_active_lookup"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_plan_access_grants_one_current_per_profile"`);
    await queryRunner.query(`DROP TABLE "plan_access_grants"`);
  }
}
