import { uuidv4 } from "@/src/contexts/shared/uuid-generator/uuid-generator";

export const CONTACT_CLICK_TYPE = {
  PHONE: "phone",
  WHATSAPP: "whatsapp",
} as const;

export type ContactClickType =
  (typeof CONTACT_CLICK_TYPE)[keyof typeof CONTACT_CLICK_TYPE];

export interface PrimitiveContactClick {
  id: string;
  vehicle_id: string;
  profile_id: string | null;
  type: ContactClickType;
  created_at: Date;
}

export class ContactClick {
  constructor(private readonly primitive_contact_click: PrimitiveContactClick) {}

  static create({
    vehicle_id,
    profile_id,
    type,
  }: {
    vehicle_id: string;
    profile_id: string | null;
    type: ContactClickType;
  }): ContactClick {
    return new ContactClick({
      id: uuidv4(),
      vehicle_id,
      profile_id,
      type,
      created_at: new Date(),
    });
  }

  static fromPrimitives(primitive: PrimitiveContactClick): ContactClick {
    return new ContactClick(primitive);
  }

  toPrimitives(): PrimitiveContactClick {
    return { ...this.primitive_contact_click };
  }
}
