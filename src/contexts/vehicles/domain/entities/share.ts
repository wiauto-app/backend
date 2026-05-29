import { uuidv4 } from "@/src/contexts/shared/uuid-generator/uuid-generator";

export interface PrimitiveShare {
  id: string;
  vehicle_id: string;
  profile_id: string | null;
  platform: string;
  source: string;
  created_at: Date;
}

export class Share {
  constructor(private readonly primitiveShare: PrimitiveShare) {}

  static create({
    vehicle_id,
    profile_id,
    platform,
    source,
  }: {
    vehicle_id: string;
    profile_id: string | null;
    platform: string;
    source: string;
  }): Share {
    return new Share({
      id: uuidv4(),
      vehicle_id,
      profile_id,
      platform,
      source,
      created_at: new Date(),
    });
  }

  static fromPrimitives(primitive: PrimitiveShare): Share {
    return new Share(primitive);
  }

  toPrimitives(): PrimitiveShare {
    return { ...this.primitiveShare };
  }
}
