import { MigrationInterface, QueryRunner } from "typeorm";

import { slugify } from "../../contexts/shared/slugify-string/slugify";

export class MunicipalitiesSlug1778500000002 implements MigrationInterface {
  name = "MunicipalitiesSlug1778500000002";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "municipalities" ADD "slug" character varying`,
    );

    const rows = (await queryRunner.query(
      `SELECT id, name, "ineCode", nuts1, nuts2, nuts3 FROM "municipalities"`,
    )) as {
      id: number;
      name: string | null;
      ineCode: string | null;
      nuts1: string | null;
      nuts2: string | null;
      nuts3: string | null;
    }[];

    const used_slugs = new Set<string>();

    for (const row of rows) {
      const name_trim = (row.name ?? "").trim();
      const ine_trim = (row.ineCode ?? "").trim();
      const nuts3_trim = (row.nuts3 ?? "").trim();
      const nuts2_trim = (row.nuts2 ?? "").trim();
      const nuts1_trim = (row.nuts1 ?? "").trim();
      const base =
        name_trim ||
        (ine_trim ? `mun-${ine_trim}` : "") ||
        nuts3_trim ||
        nuts2_trim ||
        nuts1_trim ||
        `mun-${row.id}`;
      const fallback = ine_trim ? `mun-${ine_trim}` : `mun-${row.id}`;
      let candidate = slugify(base) || slugify(fallback);
      let suffix = 0;
      while (used_slugs.has(candidate)) {
        suffix += 1;
        candidate = `${slugify(base) || slugify(fallback) || "mun"}-${suffix}`;
      }
      used_slugs.add(candidate);
      await queryRunner.query(
        `UPDATE "municipalities" SET "slug" = $1 WHERE "id" = $2`,
        [candidate, row.id],
      );
    }

    await queryRunner.query(
      `ALTER TABLE "municipalities" ALTER COLUMN "slug" SET NOT NULL`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_municipalities_slug" ON "municipalities" ("slug")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."UQ_municipalities_slug"`);
    await queryRunner.query(`ALTER TABLE "municipalities" DROP COLUMN "slug"`);
  }
}
