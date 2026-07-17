import { uuidv4 } from "@/src/contexts/shared/uuid-generator/uuid-generator";

export const LEAD_TYPE = {
  CONTACT: "contact",
  CALL_ME: "call_me",
} as const;

export type LeadType = (typeof LEAD_TYPE)[keyof typeof LEAD_TYPE];

export interface PrimitiveLead {
  id: string;
  vehicle_id: string;
  type: LeadType;
  name: string;
  email: string | null;
  phone: string | null;
  phone_code: string | null;
  message: string | null;
  callback_scheduled_at: Date | null;
  created_at: Date;
  updated_at: Date;
  profile_id: string | null;
}

export class Lead {
  constructor(private readonly primitive_lead: PrimitiveLead) {}

  static create(payload: {
    vehicle_id: string;
    type: LeadType;
    name: string;
    email: string | null;
    phone: string | null;
    phone_code: string | null;
    message: string | null;
    callback_scheduled_at?: Date | null;
    profile_id: string | null;
  }): Lead {
    return new Lead({
      id: uuidv4(),
      vehicle_id: payload.vehicle_id,
      type: payload.type,
      name: payload.name,
      email: payload.email,
      phone: payload.phone,
      phone_code: payload.phone_code,
      message: payload.message,
      callback_scheduled_at: payload.callback_scheduled_at ?? null,
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
