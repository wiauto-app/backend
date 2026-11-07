import { MigrationInterface, QueryRunner } from "typeorm";

export class DeprecateVehicleEmailNullable1794063973944
  implements MigrationInterface
{
  name = "DeprecateVehicleEmailNullable1794063973944";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "vehicles" ALTER COLUMN "email" DROP NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "vehicles" ALTER COLUMN "email" SET NOT NULL`,
    );
  }
}
