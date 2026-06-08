import { uuidv4 } from "@/src/contexts/shared/uuid-generator/uuid-generator";

export interface PrimitiveLead {
  id: string;
  vehicle_id: string;
  name: string;
  email: string;
  phone: string | null;
  phone_code: string | null;
  message: string;
  created_at: Date;
  updated_at: Date;
  profile_id: string | null;
}

export class Lead {
  constructor(private readonly primitive_lead: PrimitiveLead) {}

  static create(payload: {
    vehicle_id: string;
    name: string;
    email: string;
    phone: string | null;
    phone_code: string | null;
    message: string;
    profile_id: string | null;
  }): Lead {
    return new Lead({
      id: uuidv4(),
      vehicle_id: payload.vehicle_id,
      name: payload.name,
      email: payload.email,
      phone: payload.phone,
      phone_code: payload.phone_code,
      message: payload.message,
      profile_id: payload.profile_id,
      created_at: new Date(),
      updated_at: new Date(),
    });
  }

  static fromPrimitives(primitive: PrimitiveLead): Lead {
    return new Lead(primitive);
  }

  toPrimitives(): PrimitiveLead {
    return { ...this.primitive_lead };
  }
}
