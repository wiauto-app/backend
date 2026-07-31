import { MigrationInterface, QueryRunner } from "typeorm";

export class PlanLeadRequestsCarsQuantity1785700000000
  implements MigrationInterface
{
  name = "PlanLeadRequestsCarsQuantity1785700000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "plan_lead_requests"
      ADD COLUMN "cars_quantity" character varying NOT NULL DEFAULT ''
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "plan_lead_requests"
      DROP COLUMN "cars_quantity"
    `);
  }
}
