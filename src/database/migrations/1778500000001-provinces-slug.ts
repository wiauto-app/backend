import { MigrationInterface, QueryRunner } from "typeorm";

import { slugify } from "../../contexts/shared/slugify-string/slugify";

export class ProvincesSlug1778500000001 implements MigrationInterface {
  name = "ProvincesSlug1778500000001";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "provinces" ADD "slug" character varying`,
    );

    const rows = (await queryRunner.query(
      `SELECT id, name, cod_prov FROM "provinces"`,
    )) as {
      id: number;
      name: string | null;
      cod_prov: string;
    }[];

    const used_slugs = new Set<string>();

    for (const row of rows) {
      const name_trim = (row.name ?? "").trim();
      const base = name_trim || `prov-${row.cod_prov}`;
      let candidate = slugify(base) || slugify(`prov-${row.cod_prov}`);
      let suffix = 0;
      while (used_slugs.has(candidate)) {
        suffix += 1;
        candidate = `${slugify(base) || "prov"}-${suffix}`;
      }
      used_slugs.add(candidate);
      await queryRunner.query(`UPDATE "provinces" SET "slug" = $1 WHERE "id" = $2`, [
        candidate,
        row.id,
      ]);
    }

    await queryRunner.query(
      `ALTER TABLE "provinces" ALTER COLUMN "slug" SET NOT NULL`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_provinces_slug" ON "provinces" ("slug")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."UQ_provinces_slug"`);
    await queryRunner.query(`ALTER TABLE "provinces" DROP COLUMN "slug"`);
  }
}
