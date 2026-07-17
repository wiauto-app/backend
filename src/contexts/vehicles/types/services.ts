import { slugify } from "@/src/contexts/shared/slugify-string/slugify";
import { uuidv4 } from "@/src/contexts/shared/uuid-generator/uuid-generator";

export interface PrimitiveService {
  id: string;
  name: string;
  description: string;
  slug: string;
  created_at?: Date;
  updated_at?: Date;
}

export class Service {
  constructor(private readonly primitive_service: PrimitiveService) {}

  static create(payload: { name: string; description: string }): Service {
    return new Service({
      id: uuidv4(),
      name: payload.name,
      description: payload.description,
      slug: slugify(payload.name),
      created_at: new Date(),
      updated_at: new Date(),
    });
  }

  update(payload: { name?: string; description?: string }): Service {
    const next_name = payload.name ?? this.primitive_service.name;
    const next_description =
      payload.description ?? this.primitive_service.description;
    const next_slug =
      payload.name === undefined
        ? this.primitive_service.slug
        : slugify(next_name);
    return new Service({
      ...this.primitive_service,
      name: next_name,
      description: next_description,
      slug: next_slug,
      updated_at: new Date(),
    });
  }

  static fromPrimitives(primitive: PrimitiveService): Service {
    return new Service(primitive);
  }

  toPrimitives(): PrimitiveService {
    return {
      id: this.primitive_service.id,
      name: this.primitive_service.name,
      description: this.primitive_service.description,
      slug: this.primitive_service.slug,
      created_at: this.primitive_service.created_at,
      updated_at: this.primitive_service.updated_at,
    };
  }
}
