import { MigrationInterface, QueryRunner } from "typeorm";

export class LeadSellerDealershipDenorm1784600000000
  implements MigrationInterface
{
  name = "LeadSellerDealershipDenorm1784600000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "leads" ADD "seller_profile_id" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "leads" ADD "dealership_id" uuid`,
    );

    await queryRunner.query(`
      UPDATE "leads" AS lead
      SET "seller_profile_id" = vehicle."profile_id"
      FROM "vehicles" AS vehicle
      WHERE vehicle."id" = lead."vehicle_id"
    `);

    await queryRunner.query(`
      UPDATE "leads" AS lead
      SET "dealership_id" = dm."dealership_id"
      FROM "dealership_members" AS dm
      WHERE dm."profile_id" = lead."seller_profile_id"
    `);

    await queryRunner.query(
      `ALTER TABLE "leads" ALTER COLUMN "seller_profile_id" SET NOT NULL`,
    );

    await queryRunner.query(
      `CREATE INDEX "IDX_leads_seller_profile_id" ON "leads" ("seller_profile_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_leads_dealership_id" ON "leads" ("dealership_id")`,
    );

    await queryRunner.query(
      `ALTER TABLE "leads" ADD CONSTRAINT "FK_leads_seller_profile_id" FOREIGN KEY ("seller_profile_id") REFERENCES "profile"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "leads" ADD CONSTRAINT "FK_leads_dealership_id" FOREIGN KEY ("dealership_id") REFERENCES "dealerships"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "leads" DROP CONSTRAINT "FK_leads_dealership_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "leads" DROP CONSTRAINT "FK_leads_seller_profile_id"`,
    );
    await queryRunner.query(`DROP INDEX "IDX_leads_dealership_id"`);
    await queryRunner.query(`DROP INDEX "IDX_leads_seller_profile_id"`);
    await queryRunner.query(
      `ALTER TABLE "leads" DROP COLUMN "dealership_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "leads" DROP COLUMN "seller_profile_id"`,
    );
  }
}
