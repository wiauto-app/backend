import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Versión ↔ año pasa a ser N:M (en coches.net una versión existe en varios años).
 *
 * - `crawl.version_years`: pares del crawler; `crawl.versions.year_id` pasa a nullable.
 * - `public.version_year`: pares del catálogo público. `version.year_id` se mantiene
 *   como "año por defecto" (el más reciente) hasta que nadie lo lea.
 * - `vehicles.year_id`: año propio del anuncio (antes se heredaba de la versión).
 *
 * Los GRANT del rol `wiauto_crawler` sobre las tablas nuevas NO van aquí;
 * ver coches-net-crawl/README.md.
 */
export class VersionYearManyToMany1794900000000 implements MigrationInterface {
  name = "VersionYearManyToMany1794900000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ---------------------------------------------------------------- crawl
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS crawl.version_years (
        version_id INT NOT NULL REFERENCES crawl.versions(version_id) ON DELETE CASCADE,
        year_id INT NOT NULL REFERENCES crawl.years(id) ON DELETE CASCADE,
        PRIMARY KEY (version_id, year_id)
      )
    `);
    await queryRunner.query(`
      INSERT INTO crawl.version_years (version_id, year_id)
      SELECT version_id, year_id
      FROM crawl.versions
      WHERE year_id IS NOT NULL
      ON CONFLICT DO NOTHING
    `);
    await queryRunner.query(
      `ALTER TABLE crawl.versions ALTER COLUMN year_id DROP NOT NULL`,
    );

    // ------------------------------------------------------- version_year
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "version_year" (
        "version_id" integer NOT NULL,
        "year_id" integer NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_version_year" PRIMARY KEY ("version_id", "year_id"),
        CONSTRAINT "FK_version_year_version_id" FOREIGN KEY ("version_id")
          REFERENCES "version"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_version_year_year_id" FOREIGN KEY ("year_id")
          REFERENCES "year"("id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_version_year_year_id" ON "version_year" ("year_id")`,
    );
    await queryRunner.query(`
      INSERT INTO "version_year" ("version_id", "year_id")
      SELECT "id", "year_id"
      FROM "version"
      WHERE "year_id" IS NOT NULL
      ON CONFLICT DO NOTHING
    `);

    // ---------------------------------------------------- vehicles.year_id
    await queryRunner.query(
      `ALTER TABLE "vehicles" ADD COLUMN IF NOT EXISTS "year_id" integer`,
    );
    await queryRunner.query(`
      UPDATE "vehicles" v
      SET "year_id" = ver."year_id"
      FROM "version" ver
      WHERE ver."id" = v."version_id"
        AND v."year_id" IS NULL
    `);
    await queryRunner.query(
      `ALTER TABLE "vehicles" ALTER COLUMN "year_id" SET NOT NULL`,
    );
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_vehicles_year_id'
        ) THEN
          ALTER TABLE "vehicles"
            ADD CONSTRAINT "FK_vehicles_year_id" FOREIGN KEY ("year_id")
            REFERENCES "year"("id");
        END IF;
      END
      $$
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_vehicles_year_id" ON "vehicles" ("year_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // ---------------------------------------------------- vehicles.year_id
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_vehicles_year_id"`);
    await queryRunner.query(
      `ALTER TABLE "vehicles" DROP CONSTRAINT IF EXISTS "FK_vehicles_year_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "vehicles" DROP COLUMN IF EXISTS "year_id"`,
    );

    // ------------------------------------------------------- version_year
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_version_year_year_id"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "version_year"`);

    // ---------------------------------------------------------------- crawl
    // Recupera el año por defecto (el más reciente) de las versiones que el
    // crawler insertó sin `year_id`.
    await queryRunner.query(`
      UPDATE crawl.versions cv
      SET year_id = latest.year_id
      FROM (
        SELECT DISTINCT ON (vy.version_id) vy.version_id, vy.year_id
        FROM crawl.version_years vy
        INNER JOIN crawl.years y ON y.id = vy.year_id
        ORDER BY vy.version_id, y.year DESC
      ) latest
      WHERE latest.version_id = cv.version_id
        AND cv.year_id IS NULL
    `);
    // Sin ningún año no se puede volver a NOT NULL; el staging se re-crawlea.
    await queryRunner.query(`DELETE FROM crawl.versions WHERE year_id IS NULL`);
    await queryRunner.query(
      `ALTER TABLE crawl.versions ALTER COLUMN year_id SET NOT NULL`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS crawl.version_years`);
  }
}
