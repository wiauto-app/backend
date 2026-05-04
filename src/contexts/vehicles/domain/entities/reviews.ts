import { uuidv4 } from "@/src/contexts/shared/uuid-generator/uuid-generator";


export interface PrimitiveReview {
  id:string;
  rating:number;
  comment:string;
  created_at:Date;
  updated_at:Date;
  profile_id:string;
  vehicle_id:string;
}

export class Review {
  constructor(private readonly primitiveReview: PrimitiveReview) {}

  static create(payload: { rating: number; comment: string; profile_id: string; vehicle_id: string }): Review {
    return new Review({
      id: uuidv4(),
      rating: payload.rating,
      comment: payload.comment,
      profile_id: payload.profile_id,
      vehicle_id: payload.vehicle_id,
      created_at: new Date(),
      updated_at: new Date(),
    });
  }

  update(payload: { rating?: number; comment?: string }): Review {
    return new Review({
      ...this.primitiveReview,
      ...payload,
      updated_at: new Date(),
    });
  }

  static fromPrimitives(primitive: PrimitiveReview): Review {
    return new Review(primitive);
  }

  toPrimitives(): PrimitiveReview {
    return { ...this.primitiveReview };
  }
}

