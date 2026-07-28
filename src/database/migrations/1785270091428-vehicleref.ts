import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Añade `vehicles.ref` como entero serial único.
 * No modifica la PK ni reescribe FKs (id sigue siendo la única PK).
 */
export class Vehicleref1785270091428 implements MigrationInterface {
  name = "Vehicleref1785270091428";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "vehicles" ADD COLUMN IF NOT EXISTS "ref" integer
    `);

    await queryRunner.query(`
      CREATE SEQUENCE IF NOT EXISTS vehicles_ref_seq OWNED BY vehicles.ref
    `);

    await queryRunner.query(`
      UPDATE "vehicles"
      SET "ref" = nextval('vehicles_ref_seq')
      WHERE "ref" IS NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "vehicles"
      ALTER COLUMN "ref" SET DEFAULT nextval('vehicles_ref_seq')
    `);

    await queryRunner.query(`
      ALTER TABLE "vehicles"
      ALTER COLUMN "ref" SET NOT NULL
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_vehicles_ref" ON "vehicles" ("ref")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "UQ_vehicles_ref"`);
    await queryRunner.query(`
      ALTER TABLE "vehicles" ALTER COLUMN "ref" DROP DEFAULT
    `);
    await queryRunner.query(`
      ALTER TABLE "vehicles" DROP COLUMN IF EXISTS "ref"
    `);
    await queryRunner.query(`DROP SEQUENCE IF EXISTS vehicles_ref_seq`);
  }
}
