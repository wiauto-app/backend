import { slugify } from "@/src/contexts/shared/slugify-string/slugify";
import { uuidv4 } from "@/src/contexts/shared/uuid-generator/uuid-generator";

export interface PrimitiveWarrantyType {
  id: string;
  name: string;
  description: string;
  slug: string;
  created_at?: Date;
  updated_at?: Date;
}

export class WarrantyType {
  constructor(private readonly primitive_warranty_type: PrimitiveWarrantyType) {}

  static create(payload: { name: string; description: string }): WarrantyType {
    return new WarrantyType({
      id: uuidv4(),
      name: payload.name.trim(),
      description: payload.description,
      slug: slugify(payload.name.trim()),
      created_at: new Date(),
      updated_at: new Date(),
    });
  }

  update(payload: { name?: string; description?: string }): WarrantyType {
    const next_name =
      payload.name === undefined
        ? this.primitive_warranty_type.name
        : payload.name.trim();
    const next_description =
      payload.description === undefined
        ? this.primitive_warranty_type.description
        : payload.description;
    const next_slug =
      payload.name === undefined
        ? this.primitive_warranty_type.slug
        : slugify(next_name);
    return new WarrantyType({
      ...this.primitive_warranty_type,
      name: next_name,
      description: next_description,
      slug: next_slug,
      updated_at: new Date(),
    });
  }

  static fromPrimitives(primitive: PrimitiveWarrantyType): WarrantyType {
    return new WarrantyType(primitive);
  }

  toPrimitives(): PrimitiveWarrantyType {
    return {
      id: this.primitive_warranty_type.id,
      name: this.primitive_warranty_type.name,
      description: this.primitive_warranty_type.description,
      slug: this.primitive_warranty_type.slug,
      created_at: this.primitive_warranty_type.created_at,
      updated_at: this.primitive_warranty_type.updated_at,
    };
  }
}
