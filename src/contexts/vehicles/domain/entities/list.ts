import { uuidv4 } from "@/src/contexts/shared/uuid-generator/uuid-generator";

export interface PrimitiveList {
  id: string;
  profile_id: string;
  is_default: boolean;
  name: string;
  description: string | null;
  created_at: Date;
}

export class List {
  constructor(private readonly primitive_list: PrimitiveList) { }

  static create({
    profile_id,
    is_default,
    name,
    description,
  }: {
    profile_id: string;
    is_default: boolean;
    name: string;
    description: string | null;
  }): List {
    return new List({
      id: uuidv4(),
      profile_id,
      is_default,
      name,
      description,
      created_at: new Date(),
    });
  }

  static fromPrimitives(primitive: PrimitiveList): List {
    return new List(primitive);
  }

  update(fields: {
    name?: string;
    description?: string | null;
    is_default?: boolean;
  }): List {
    return new List({
      ...this.primitive_list,
      name: fields.name ?? this.primitive_list.name,
      description: fields.description ?? this.primitive_list.description,
      is_default: fields.is_default ?? this.primitive_list.is_default,
    });
  }

  toPrimitives(): PrimitiveList {
    return { ...this.primitive_list };
  }
}
