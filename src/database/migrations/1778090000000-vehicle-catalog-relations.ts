import { MigrationInterface, QueryRunner } from "typeorm";

export class VehicleCatalogRelations1778090000000 implements MigrationInterface {
  name = "VehicleCatalogRelations1778090000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "vehicles" ADD "vehicle_type_id" uuid`,
    );
    await queryRunner.query(`ALTER TABLE "vehicles" ADD "color_id" uuid`);
    await queryRunner.query(`ALTER TABLE "vehicles" ADD "dgt_label_id" uuid`);
    await queryRunner.query(
      `ALTER TABLE "vehicles" ADD "warranty_type_id" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "vehicles" ADD CONSTRAINT "FK_vehicles_vehicle_type_id" FOREIGN KEY ("vehicle_type_id") REFERENCES "vehicle_types"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "vehicles" ADD CONSTRAINT "FK_vehicles_color_id" FOREIGN KEY ("color_id") REFERENCES "colors"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "vehicles" ADD CONSTRAINT "FK_vehicles_dgt_label_id" FOREIGN KEY ("dgt_label_id") REFERENCES "dgt_labels"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "vehicles" ADD CONSTRAINT "FK_vehicles_warranty_type_id" FOREIGN KEY ("warranty_type_id") REFERENCES "warranty_types"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `CREATE TABLE "vehicle_services" ("servicesId" uuid NOT NULL, "vehiclesId" uuid NOT NULL, CONSTRAINT "PK_7c8b9a1e2f3d4c5b6a7980_vehicle_services" PRIMARY KEY ("servicesId", "vehiclesId"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_vehicle_services_servicesId" ON "vehicle_services" ("servicesId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_vehicle_services_vehiclesId" ON "vehicle_services" ("vehiclesId")`,
    );
    await queryRunner.query(
      `ALTER TABLE "vehicle_services" ADD CONSTRAINT "FK_vehicle_services_servicesId" FOREIGN KEY ("servicesId") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "vehicle_services" ADD CONSTRAINT "FK_vehicle_services_vehiclesId" FOREIGN KEY ("vehiclesId") REFERENCES "vehicles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "vehicle_services" DROP CONSTRAINT "FK_vehicle_services_vehiclesId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "vehicle_services" DROP CONSTRAINT "FK_vehicle_services_servicesId"`,
    );
    await queryRunner.query(`DROP TABLE "vehicle_services"`);
    await queryRunner.query(
      `ALTER TABLE "vehicles" DROP CONSTRAINT "FK_vehicles_warranty_type_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "vehicles" DROP CONSTRAINT "FK_vehicles_dgt_label_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "vehicles" DROP CONSTRAINT "FK_vehicles_color_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "vehicles" DROP CONSTRAINT "FK_vehicles_vehicle_type_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "vehicles" DROP COLUMN "warranty_type_id"`,
    );
    await queryRunner.query(`ALTER TABLE "vehicles" DROP COLUMN "dgt_label_id"`);
    await queryRunner.query(`ALTER TABLE "vehicles" DROP COLUMN "color_id"`);
    await queryRunner.query(
      `ALTER TABLE "vehicles" DROP COLUMN "vehicle_type_id"`,
    );
  }
}
