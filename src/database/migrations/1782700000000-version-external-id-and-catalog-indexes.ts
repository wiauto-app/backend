import { MigrationInterface, QueryRunner } from "typeorm";

export class VersionExternalIdAndCatalogIndexes1782700000000
  implements MigrationInterface
{
  name = "VersionExternalIdAndCatalogIndexes1782700000000";

  private async createUniqueIndexIfSafe(
    queryRunner: QueryRunner,
    indexName: string,
    createSql: string,
    duplicateCheckSql: string,
  ): Promise<void> {
    const duplicates = await queryRunner.query(duplicateCheckSql);
    if (duplicates.length > 0) {
      // eslint-disable-next-line no-console
      console.warn(
        `[migration ${this.name}] Skip unique index ${indexName}: hay ${duplicates.length} duplicados existentes`,
      );
      return;
    }
    await queryRunner.query(createSql);
  }

  public async up(queryRunner: QueryRunner): Promise<void> {
    const versionHasExternalId = await queryRunner.query(`
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'version'
        AND column_name = 'version_id'
      LIMIT 1
    `);

    if (!versionHasExternalId.length) {
      await queryRunner.query(
        `ALTER TABLE "version" ADD "version_id" integer`,
      );
    }

    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "UQ_version_external_version_id" ON "version" ("version_id") WHERE "version_id" IS NOT NULL`,
    );

    const makeHasSection1Id = await queryRunner.query(`
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'make'
        AND column_name = 'section_1_id'
      LIMIT 1
    `);

    if (!makeHasSection1Id.length) {
      await queryRunner.query(
        `ALTER TABLE "make" ADD "section_1_id" integer`,
      );
    }

    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "UQ_make_section_1_id" ON "make" ("section_1_id") WHERE "section_1_id" IS NOT NULL`,
    );

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_model_make_id" ON "model" ("make_id")`,
    );

    await this.createUniqueIndexIfSafe(
      queryRunner,
      "UQ_model_make_id_model_id",
      `CREATE UNIQUE INDEX "UQ_model_make_id_model_id" ON "model" ("make_id", "model_id")`,
      `SELECT make_id, model_id FROM model GROUP BY make_id, model_id HAVING count(*) > 1 LIMIT 1`,
    );

    await this.createUniqueIndexIfSafe(
      queryRunner,
      "UQ_fuel_type_fuel_id",
      `CREATE UNIQUE INDEX "UQ_fuel_type_fuel_id" ON "fuel_type" ("fuel_id")`,
      `SELECT fuel_id FROM fuel_type GROUP BY fuel_id HAVING count(*) > 1 LIMIT 1`,
    );

    await this.createUniqueIndexIfSafe(
      queryRunner,
      "UQ_year_year",
      `CREATE UNIQUE INDEX "UQ_year_year" ON "year" ("year")`,
      `SELECT year FROM year GROUP BY year HAVING count(*) > 1 LIMIT 1`,
    );

    await this.createUniqueIndexIfSafe(
      queryRunner,
      "UQ_body_type_body_type_id_doors",
      `CREATE UNIQUE INDEX "UQ_body_type_body_type_id_doors" ON "body_type" ("body_type_id", "doors")`,
      `SELECT body_type_id, doors FROM body_type GROUP BY body_type_id, doors HAVING count(*) > 1 LIMIT 1`,
    );

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_version_make_id" ON "version" ("make_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_version_model_id" ON "version" ("model_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_version_body_type_id" ON "version" ("body_type_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_version_fuel_type_id" ON "version" ("fuel_type_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_version_year_id" ON "version" ("year_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_vehicles_version_id" ON "vehicles" ("version_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_vehicles_version_id"`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_version_year_id"`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_version_fuel_type_id"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_version_body_type_id"`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_version_model_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_version_make_id"`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS "UQ_body_type_body_type_id_doors"`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "UQ_year_year"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "UQ_fuel_type_fuel_id"`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS "UQ_model_make_id_model_id"`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_model_make_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "UQ_make_section_1_id"`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS "UQ_version_external_version_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "version" DROP COLUMN IF EXISTS "version_id"`,
    );
  }
}
