import { slugify } from "@/src/contexts/shared/slugify-string/slugify";
import { FEATURE_UI_CATEGORY_SLUGS } from "@/src/contexts/vehicles/catalog/features/feature-category.constants";
import { FEATURE_CATALOG_SEED } from "@/src/contexts/vehicles/catalog/features/feature-catalog.seed";
import { Feature } from "@/src/contexts/vehicles/types/features";

describe("feature catalog seed", () => {
  it("covers every UI category without duplicate slugs", () => {
    const slugs = FEATURE_CATALOG_SEED.map((item) => slugify(item.name));
    const uniqueSlugs = new Set(slugs);

    expect(FEATURE_CATALOG_SEED.length).toBeGreaterThanOrEqual(100);
    expect(uniqueSlugs.size).toBe(FEATURE_CATALOG_SEED.length);

    for (const category of FEATURE_UI_CATEGORY_SLUGS) {
      expect(
        FEATURE_CATALOG_SEED.some((item) => item.category === category),
      ).toBe(true);
    }
  });

  it("exposes category on PrimitiveFeature", () => {
    const feature = Feature.create({
      name: "Aire acondicionado",
      category: "confort",
    });

    expect(feature.toPrimitives()).toMatchObject({
      name: "Aire acondicionado",
      slug: "aire-acondicionado",
      category: "confort",
    });
  });
});
