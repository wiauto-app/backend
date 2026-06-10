import { MigrationInterface, QueryRunner } from "typeorm";

export class AddVehicleStatusChangeMessage1781000000000
  implements MigrationInterface
{
  name = "AddVehicleStatusChangeMessage1781000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "vehicles" ADD "status_change_message" text`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "vehicles" DROP COLUMN "status_change_message"`,
    );
  }
}
