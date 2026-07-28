import { uuidv4 } from "@/src/contexts/shared/uuid-generator/uuid-generator";

export interface PrimitiveImpression {
  id: string;
  vehicle_id: string;
  profile_id: string | null;
  created_at: Date;
}

export class Impression {
  constructor(private readonly primitive_impression: PrimitiveImpression) {}

  static create({
    vehicle_id,
    profile_id,
  }: {
    vehicle_id: string;
    profile_id: string | null;
  }): Impression {
    return new Impression({
      id: uuidv4(),
      vehicle_id,
      profile_id,
      created_at: new Date(),
    });
  }

  static fromPrimitives(primitive: PrimitiveImpression): Impression {
    return new Impression(primitive);
  }

  toPrimitives(): PrimitiveImpression {
    return { ...this.primitive_impression };
  }
}
