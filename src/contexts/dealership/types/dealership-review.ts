import { uuidv4 } from "@/src/contexts/shared/uuid-generator/uuid-generator";

export interface PrimitiveDealershipReview {
  id: string;
  rating: number;
  comment: string;
  created_at: Date;
  updated_at: Date;
  profile_id: string;
  dealership_id: string;
}

export class DealershipReview {
  constructor(private readonly primitive_dealership_review: PrimitiveDealershipReview) {}

  static create(payload: {
    rating: number;
    comment: string;
    profile_id: string;
    dealership_id: string;
  }): DealershipReview {
    return new DealershipReview({
      id: uuidv4(),
      rating: payload.rating,
      comment: payload.comment,
      profile_id: payload.profile_id,
      dealership_id: payload.dealership_id,
      created_at: new Date(),
      updated_at: new Date(),
    });
  }

  update(payload: { rating?: number; comment?: string }): DealershipReview {
    return new DealershipReview({
      ...this.primitive_dealership_review,
      ...payload,
      updated_at: new Date(),
    });
  }

  static fromPrimitives(primitive: PrimitiveDealershipReview): DealershipReview {
    return new DealershipReview(primitive);
  }

  toPrimitives(): PrimitiveDealershipReview {
    return { ...this.primitive_dealership_review };
  }
}
