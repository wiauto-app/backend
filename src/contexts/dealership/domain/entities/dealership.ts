import { uuidv4 } from "@/src/contexts/shared/uuid-generator/uuid-generator";

import { CreateDealershipPayload } from "../payloads/create-dealership.payload";
import { UpdateDealershipPayload } from "../payloads/update-dealership.payload";

export interface PrimitiveDealership {
  id: string;
  name: string;
  slug: string;
  avatar_url?: string;
  banner_url?: string;
  description: string;
  website_url?: string;
  email: string;
  phone_code: string;
  phone: string;
  address: string;
  lat?: number;
  lng?: number;
  is_featured: boolean;
  show_phone: boolean;
  rating: number | null;
  created_at: Date;
  updated_at: Date;
}

export class Dealership {
  constructor(private readonly primitive_dealership: PrimitiveDealership) {}

  static create(payload: CreateDealershipPayload): Dealership {
    const today = new Date();
    return new Dealership({
      id: uuidv4(),
      name: payload.name,
      slug: payload.slug,
      avatar_url: payload.avatar_url,
      banner_url: payload.banner_url,
      description: payload.description,
      website_url: payload.website_url,
      email: payload.email,
      phone_code: payload.phone_code,
      phone: payload.phone,
      address: payload.address,
      lat: payload.lat,
      lng: payload.lng,
      is_featured: false,
      show_phone: payload.show_phone ?? true,
      rating: null,
      created_at: today,
      updated_at: today,
    });
  }

  update(payload: UpdateDealershipPayload): Dealership {
    return new Dealership({
      ...this.primitive_dealership,
      ...payload,
      updated_at: new Date(),
    });
  }

  static fromPrimitives(primitive: PrimitiveDealership): Dealership {
    return new Dealership(primitive);
  }

  toPrimitives(): PrimitiveDealership {
    return { ...this.primitive_dealership };
  }
}
