import { slugify } from "@/src/contexts/shared/slugify-string/slugify";
import { uuidv4 } from "@/src/contexts/shared/uuid-generator/uuid-generator";

export interface PrimitiveFeature {
  id: string;
  name: string;
  slug: string;
  created_at?: Date;
  updated_at?: Date;
}

export class Feature {
  constructor(private readonly primitive_feature: PrimitiveFeature) {}

  static create(create_features: { name: string }): Feature {
    return new Feature({
      id: uuidv4(),
      name: create_features.name,
      slug: slugify(create_features.name),
      created_at: new Date(),
      updated_at: new Date(),
    });
  }

  update(update_feature: { name: string }): Feature {
    return new Feature({
      ...this.primitive_feature,
      name: update_feature.name,
      slug: slugify(update_feature.name),
      updated_at: new Date(),
    });
  }

  static fromPrimitives(primitive: PrimitiveFeature): Feature {
    return new Feature(primitive);
  }

  toPrimitives(): PrimitiveFeature {
    return {
      id: this.primitive_feature.id,
      name: this.primitive_feature.name,
      slug: this.primitive_feature.slug,
      created_at: this.primitive_feature.created_at,
      updated_at: this.primitive_feature.updated_at,
    };
  }
}
