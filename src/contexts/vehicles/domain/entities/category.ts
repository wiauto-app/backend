import { uuidv4 } from "@/src/contexts/shared/uuid-generator/uuid-generator";
import { slugify } from "@/src/contexts/shared/slugify-string/slugify";

export interface PrimitiveCategory {
  id: string;
  name: string;
  slug: string;
  image_url?: string | null;
  created_at?: Date;
  updated_at?: Date;
}

export class Category {
  constructor(private readonly primitive_category: PrimitiveCategory) { }

  static create({ name, image_url }: { name: string; image_url?: string | null }): Category {
    return new Category({
      id: uuidv4(),
      name,
      slug: slugify(name),
      image_url: image_url ?? null,
      created_at: new Date(),
      updated_at: new Date(),
    });
  }

  update(update_category: { name?: string; image_url?: string | null }): Category {
    const previous = this.primitive_category;
    const next_name = update_category.name ?? previous.name;
    const next_image_url =
      update_category.image_url ??
        previous.image_url ?? null;
    const name_changed =
      update_category.name !== undefined && update_category.name !== previous.name;

    return new Category({
      ...previous,
      name: next_name,
      slug: name_changed ? slugify(next_name) : previous.slug,
      image_url: next_image_url,
      updated_at: new Date(),
    });
  }

  static fromPrimitives(primitive: PrimitiveCategory): Category {
    return new Category(primitive);
  }

  toPrimitives(): PrimitiveCategory {
    return {
      ...this.primitive_category,
    };
  }
}