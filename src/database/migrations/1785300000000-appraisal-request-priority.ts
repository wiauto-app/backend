import { MigrationInterface, QueryRunner } from "typeorm";

export class AppraisalRequestPriority1785300000000 implements MigrationInterface {
  name = "AppraisalRequestPriority1785300000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "appraisal_requests_priority_enum" AS ENUM ('low', 'high')
    `);

    await queryRunner.query(`
      ALTER TABLE "appraisal_requests"
      ADD COLUMN "priority" "appraisal_requests_priority_enum" NOT NULL DEFAULT 'low'
    `);

    await queryRunner.query(`
      ALTER TABLE "appraisal_requests"
      ADD COLUMN "profile_id" uuid
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_appraisal_requests_priority"
      ON "appraisal_requests" ("priority")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_appraisal_requests_priority"`);
    await queryRunner.query(`
      ALTER TABLE "appraisal_requests" DROP COLUMN "profile_id"
    `);
    await queryRunner.query(`
      ALTER TABLE "appraisal_requests" DROP COLUMN "priority"
    `);
    await queryRunner.query(`DROP TYPE "appraisal_requests_priority_enum"`);
  }
}
