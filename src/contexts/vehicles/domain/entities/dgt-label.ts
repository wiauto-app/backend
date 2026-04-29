import { slugify } from "@/src/contexts/shared/slugify-string/slugify";
import { uuidv4 } from "@/src/contexts/shared/uuid-generator/uuid-generator";

const normalize_dgt_code = (code: string): string => code.trim().toUpperCase();

export interface PrimitiveDgtLabel {
  id: string;
  name: string;
  code: string;
  description: string;
  slug: string;
  created_at?: Date;
  updated_at?: Date;
}

export class DgtLabel {
  constructor(private readonly primitive_dgt_label: PrimitiveDgtLabel) {}

  static create(payload: {
    name: string;
    code: string;
    description: string;
  }): DgtLabel {
    return new DgtLabel({
      id: uuidv4(),
      name: payload.name.trim(),
      code: normalize_dgt_code(payload.code),
      description: payload.description,
      slug: slugify(payload.name.trim()),
      created_at: new Date(),
      updated_at: new Date(),
    });
  }

  update(payload: {
    name?: string;
    code?: string;
    description?: string;
  }): DgtLabel {
    const next_name =
      payload.name === undefined
        ? this.primitive_dgt_label.name
        : payload.name.trim();
    const next_code =
      payload.code === undefined
        ? this.primitive_dgt_label.code
        : normalize_dgt_code(payload.code);
    const next_description =
      payload.description === undefined
        ? this.primitive_dgt_label.description
        : payload.description;
    const next_slug =
      payload.name === undefined
        ? this.primitive_dgt_label.slug
        : slugify(next_name);
    return new DgtLabel({
      ...this.primitive_dgt_label,
      name: next_name,
      code: next_code,
      description: next_description,
      slug: next_slug,
      updated_at: new Date(),
    });
  }

  static fromPrimitives(primitive: PrimitiveDgtLabel): DgtLabel {
    return new DgtLabel(primitive);
  }

  toPrimitives(): PrimitiveDgtLabel {
    return {
      id: this.primitive_dgt_label.id,
      name: this.primitive_dgt_label.name,
      code: this.primitive_dgt_label.code,
      description: this.primitive_dgt_label.description,
      slug: this.primitive_dgt_label.slug,
      created_at: this.primitive_dgt_label.created_at,
      updated_at: this.primitive_dgt_label.updated_at,
    };
  }
}
