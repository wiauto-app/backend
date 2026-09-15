import { QueryRunner } from "typeorm";

import { slugify } from "../../../shared/slugify-string/slugify";
import { FEATURE_LEFTOVER_CATEGORY_SLUG } from "./feature-category.constants";
import { FEATURE_CATALOG_SEED } from "./feature-catalog.seed";

interface FeatureIdRow {
  id: string;
}

export const upsertFeatureCatalog = async (
  queryRunner: QueryRunner,
): Promise<void> => {
  const seedSlugs: string[] = [];

  for (const item of FEATURE_CATALOG_SEED) {
    const slug = slugify(item.name);
    seedSlugs.push(slug);

    const bySlug: FeatureIdRow[] = await queryRunner.query(
      `SELECT "id" FROM "features" WHERE "slug" = $1 LIMIT 1`,
      [slug],
    );

    if (bySlug.length > 0) {
      await queryRunner.query(
        `UPDATE "features"
         SET "name" = $1, "category" = $2, "updated_at" = now()
         WHERE "id" = $3`,
        [item.name, item.category, bySlug[0].id],
      );
      continue;
    }

    const byName: FeatureIdRow[] = await queryRunner.query(
      `SELECT "id" FROM "features" WHERE "name" = $1 LIMIT 1`,
      [item.name],
    );

    if (byName.length > 0) {
      await queryRunner.query(
        `UPDATE "features"
         SET "slug" = $1, "category" = $2, "updated_at" = now()
         WHERE "id" = $3`,
        [slug, item.category, byName[0].id],
      );
      continue;
    }

    await queryRunner.query(
      `INSERT INTO "features" ("id", "name", "slug", "category", "created_at", "updated_at")
       VALUES (uuid_generate_v4(), $1, $2, $3, now(), now())`,
      [item.name, slug, item.category],
    );
  }

  const leftoverPlaceholders = seedSlugs
    .map((_, index) => `$${index + 1}`)
    .join(", ");

  await queryRunner.query(
    `UPDATE "features"
     SET "category" = $${seedSlugs.length + 1}, "updated_at" = now()
     WHERE "slug" NOT IN (${leftoverPlaceholders})`,
    [...seedSlugs, FEATURE_LEFTOVER_CATEGORY_SLUG],
  );
};
