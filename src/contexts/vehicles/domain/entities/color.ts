import { slugify } from "@/src/contexts/shared/slugify-string/slugify";
import { uuidv4 } from "@/src/contexts/shared/uuid-generator/uuid-generator";

export interface PrimitiveColor {
  id: string;
  name: string;
  hex_code: string;
  slug: string;
  created_at?: Date;
  updated_at?: Date;
}

export class Color {
  constructor(private readonly primitive_color: PrimitiveColor) {}

  static create({ name, hex_code }: { name: string; hex_code: string }): Color {
    return new Color({
      id: uuidv4(),
      name,
      hex_code,
      slug: slugify(name),
      created_at: new Date(),
      updated_at: new Date(),
    });
  }

  update(update_color: { name: string; hex_code: string }): Color {
    return new Color({
      ...this.primitive_color,
      ...update_color,
      updated_at: new Date(),
    });
  }

  static fromPrimitives(primitive: PrimitiveColor): Color {
    return new Color(primitive);
  }

  toPrimitives(): PrimitiveColor {
    return {
      id: this.primitive_color.id,
      name: this.primitive_color.name,
      hex_code: this.primitive_color.hex_code,
      slug: this.primitive_color.slug,
      created_at: this.primitive_color.created_at,
      updated_at: this.primitive_color.updated_at,
    };
  }
}
