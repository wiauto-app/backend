import { MigrationInterface, QueryRunner } from "typeorm";

export class CuotasAndVehicleCuotaFk1778200000000 implements MigrationInterface {
  name = "CuotasAndVehicleCuotaFk1778200000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "cuotas" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "slug" character varying NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_cuotas_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_cuotas_slug" ON "cuotas" ("slug")`,
    );
    await queryRunner.query(
      `ALTER TABLE "vehicles" ADD "cuota_id" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "vehicles" ADD CONSTRAINT "FK_vehicles_cuota" FOREIGN KEY ("cuota_id") REFERENCES "cuotas"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "vehicles" DROP CONSTRAINT "FK_vehicles_cuota"`,
    );
    await queryRunner.query(`ALTER TABLE "vehicles" DROP COLUMN "cuota_id"`);
    await queryRunner.query(`DROP TABLE "cuotas"`);
  }
}
