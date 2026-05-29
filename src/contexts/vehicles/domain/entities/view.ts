import { uuidv4 } from "@/src/contexts/shared/uuid-generator/uuid-generator";


export interface PrimitiveView {
  id: string;
  vehicle_id: string;
  profile_id: string | null;
  ip_hash: string | null;
  user_agent: string | null;
  referer: string | null;
  metadata: Record<string, any>;
  created_at: Date;
}


export class View {
  constructor(private readonly primitiveView: PrimitiveView) { }

  static create({ vehicle_id, profile_id, ip_hash, user_agent, referer, metadata }: { vehicle_id: string, profile_id: string | null, ip_hash: string | null, user_agent: string | null, referer: string | null, metadata: Record<string, any> }): View {
    return new View({
      id: uuidv4(),
      vehicle_id,
      profile_id,
      ip_hash,
      user_agent,
      referer,
      metadata,
      created_at: new Date(),
    });
  }

  static fromPrimitives(primitive: PrimitiveView): View {
    return new View(primitive);
  }

  toPrimitives(): PrimitiveView {
    return { ...this.primitiveView };
  }
}