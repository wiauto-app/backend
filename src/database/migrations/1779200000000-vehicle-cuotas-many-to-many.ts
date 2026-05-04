import { MigrationInterface, QueryRunner } from "typeorm";

export class VehicleCuotasManyToMany1779200000000 implements MigrationInterface {
  name = "VehicleCuotasManyToMany1779200000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "vehicle_cuotas" (
        "vehicle_id" uuid NOT NULL,
        "cuota_id" uuid NOT NULL,
        CONSTRAINT "PK_vehicle_cuotas" PRIMARY KEY ("vehicle_id", "cuota_id")
      )
    `);
    await queryRunner.query(`
      ALTER TABLE "vehicle_cuotas"
      ADD CONSTRAINT "FK_vehicle_cuotas_vehicle"
      FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "vehicle_cuotas"
      ADD CONSTRAINT "FK_vehicle_cuotas_cuota"
      FOREIGN KEY ("cuota_id") REFERENCES "cuotas"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_vehicle_cuotas_vehicle_id" ON "vehicle_cuotas" ("vehicle_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_vehicle_cuotas_cuota_id" ON "vehicle_cuotas" ("cuota_id")`,
    );
    await queryRunner.query(`
      INSERT INTO "vehicle_cuotas" ("vehicle_id", "cuota_id")
      SELECT "id", "cuota_id" FROM "vehicles" WHERE "cuota_id" IS NOT NULL
    `);
    await queryRunner.query(
      `ALTER TABLE "vehicles" DROP CONSTRAINT IF EXISTS "FK_vehicles_cuota"`,
    );
    await queryRunner.query(
      `ALTER TABLE "vehicles" DROP CONSTRAINT IF EXISTS "FK_5a8c19d41ce734650879f5ab23a"`,
    );
    await queryRunner.query(`ALTER TABLE "vehicles" DROP COLUMN "cuota_id"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "vehicles" ADD "cuota_id" uuid`);
    await queryRunner.query(`
      UPDATE "vehicles" v
      SET "cuota_id" = sub."cuota_id"
      FROM (
        SELECT DISTINCT ON ("vehicle_id") "vehicle_id", "cuota_id"
        FROM "vehicle_cuotas"
        ORDER BY "vehicle_id", "cuota_id"
      ) sub
      WHERE sub."vehicle_id" = v."id"
    `);
    await queryRunner.query(`
      ALTER TABLE "vehicles"
      ADD CONSTRAINT "FK_vehicles_cuota"
      FOREIGN KEY ("cuota_id") REFERENCES "cuotas"("id") ON DELETE SET NULL ON UPDATE NO ACTION
    `);
    await queryRunner.query(`DROP TABLE "vehicle_cuotas"`);
  }
}
