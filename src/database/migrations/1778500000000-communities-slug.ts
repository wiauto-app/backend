import { MigrationInterface, QueryRunner } from "typeorm";

import { slugify } from "../../contexts/shared/slugify-string/slugify";

export class CommunitiesSlug1778500000000 implements MigrationInterface {
  name = "CommunitiesSlug1778500000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "communities" ADD "slug" character varying`,
    );

    const rows = await queryRunner.query(
      `SELECT id, name, noml_ccaa, cod_ccaa FROM "communities"`,
    ) as {
      id: number;
      name: string | null;
      noml_ccaa: string | null;
      cod_ccaa: string;
    }[];

    const used_slugs = new Set<string>();

    for (const row of rows) {
      const name_trim = (row.name ?? "").trim();
      const noml_trim = (row.noml_ccaa ?? "").trim();
      const base = name_trim || noml_trim || `ccaa-${row.cod_ccaa}`;
      let candidate = slugify(base) || slugify(`ccaa-${row.cod_ccaa}`);
      let suffix = 0;
      while (used_slugs.has(candidate)) {
        suffix += 1;
        candidate = `${slugify(base) || "ccaa"}-${suffix}`;
      }
      used_slugs.add(candidate);
      await queryRunner.query(`UPDATE "communities" SET "slug" = $1 WHERE "id" = $2`, [
        candidate,
        row.id,
      ]);
    }

    await queryRunner.query(
      `ALTER TABLE "communities" ALTER COLUMN "slug" SET NOT NULL`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_communities_slug" ON "communities" ("slug")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."UQ_communities_slug"`);
    await queryRunner.query(`ALTER TABLE "communities" DROP COLUMN "slug"`);
  }
}
