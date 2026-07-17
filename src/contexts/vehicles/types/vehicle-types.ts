import { slugify } from "@/src/contexts/shared/slugify-string/slugify";
import { uuidv4 } from "@/src/contexts/shared/uuid-generator/uuid-generator";
export interface PrimitiveVehicleType {
  id: string;
  name: string;
  slug: string;
  image_url?: string | null;
  created_at?: Date;
  updated_at?: Date;
}

export class VehicleType {
  constructor(private readonly primitiveVehicleType: PrimitiveVehicleType) {}

  static create({name, image_url}: {name: string, image_url?: string | null}): VehicleType {
    return new VehicleType({ 
      id: uuidv4(),
      name,
      slug: slugify(name),
      image_url,
      created_at: new Date(),
      updated_at: new Date(),
    });
  }

  update(updateVehicleType: { name: string, image_url?: string | null }): VehicleType {
    return new VehicleType({
      ...this.primitiveVehicleType,
      ...updateVehicleType,
      updated_at: new Date(),
    });
  }

  static fromPrimitives(primitive: PrimitiveVehicleType): VehicleType {
    return new VehicleType(primitive);
  }

  toPrimitives(): PrimitiveVehicleType {
    return {
      id: this.primitiveVehicleType.id,
      name: this.primitiveVehicleType.name,
      slug: this.primitiveVehicleType.slug,
      image_url: this.primitiveVehicleType.image_url,
      created_at: this.primitiveVehicleType.created_at,
      updated_at: this.primitiveVehicleType.updated_at,
    };
  }
}