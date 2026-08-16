import { MigrationInterface, QueryRunner } from "typeorm";

export class CompleteVehicleFinancingAndVideos1786900000000
  implements MigrationInterface
{
  name = "CompleteVehicleFinancingAndVideos1786900000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "vehicles" ALTER COLUMN "finance_price" TYPE numeric(12,2)`,
    );
    await queryRunner.query(
      `ALTER TABLE "vehicles" ADD "first_cuota" numeric(12,2)`,
    );
    await queryRunner.query(
      `ALTER TABLE "vehicle_videos" ADD "order" integer NOT NULL DEFAULT 0`,
    );
    await queryRunner.query(
      `ALTER TABLE "vehicle_videos" ALTER COLUMN "status" SET DEFAULT 'active'`,
    );
    await queryRunner.query(
      `ALTER TABLE "vehicle_videos" DROP CONSTRAINT "FK_7b924b07f47d593057c7edf6001"`,
    );
    await queryRunner.query(
      `ALTER TABLE "vehicle_videos" ADD CONSTRAINT "FK_7b924b07f47d593057c7edf6001" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "vehicle_videos" DROP CONSTRAINT "FK_7b924b07f47d593057c7edf6001"`,
    );
    await queryRunner.query(
      `ALTER TABLE "vehicle_videos" ADD CONSTRAINT "FK_7b924b07f47d593057c7edf6001" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "vehicle_videos" ALTER COLUMN "status" DROP DEFAULT`,
    );
    await queryRunner.query(`ALTER TABLE "vehicle_videos" DROP COLUMN "order"`);
    await queryRunner.query(`ALTER TABLE "vehicles" DROP COLUMN "first_cuota"`);
    await queryRunner.query(
      `ALTER TABLE "vehicles" ALTER COLUMN "finance_price" TYPE numeric(2,1)`,
    );
  }
}
