import { slugify } from "@/src/contexts/shared/slugify-string/slugify";

export interface PrimitiveCatalogFuelType {
  id?: number;
  fuel_id: number;
  name: string;
  slug: string;
  can_charge: boolean;
  created_at?: Date;
}

export class CatalogFuelType {
  constructor(private readonly primitive: PrimitiveCatalogFuelType) {}

  static create(payload: {
    fuel_id: number;
    name: string;
    can_charge: boolean;
  }): CatalogFuelType {
    const name = payload.name.trim();
    return new CatalogFuelType({
      fuel_id: payload.fuel_id,
      name,
      slug: slugify(name),
      can_charge: payload.can_charge,
    });
  }

  update(
    payload: Partial<Pick<PrimitiveCatalogFuelType, "fuel_id" | "name" | "can_charge">>,
  ): CatalogFuelType {
    const name =
      payload.name !== undefined ? payload.name.trim() : this.primitive.name;
    const next_slug =
      payload.name !== undefined ? slugify(name) : this.primitive.slug;
    const can_charge =
      payload.can_charge !== undefined
        ? payload.can_charge
        : this.primitive.can_charge;
    return new CatalogFuelType({
      ...this.primitive,
      ...payload,
      name,
      slug: next_slug,
      can_charge,
    });
  }

  static fromPrimitives(p: PrimitiveCatalogFuelType): CatalogFuelType {
    return new CatalogFuelType(p);
  }

  toPrimitives(): PrimitiveCatalogFuelType {
    return { ...this.primitive };
  }
}
