import { uuidv4 } from "@/src/contexts/shared/uuid-generator/uuid-generator";
import { CreateDealershipMemberPayload } from "../types/dealership-member/create-dealership-member.payload";
import { UpdateDealershipMemberPayload } from "../types/dealership-member/update-dealership-member.payload";


export interface PrimitiveDealershipMember {
  id: string;
  dealership_id: string;
  profile_id: string;
  role: "owner" | "admin" | "member";
  created_at: Date;
  updated_at: Date;
}

export class DealershipMember {
  constructor(private readonly primitive_dealership_member: PrimitiveDealershipMember) {
  }

  static create(payload: CreateDealershipMemberPayload): DealershipMember {
    const today = new Date();
    return new DealershipMember({
      id: uuidv4(),
      dealership_id: payload.dealership_id,
      profile_id: payload.profile_id,
      role: payload.role,
      created_at: today,
      updated_at: today,
    });
  }

  update(payload: UpdateDealershipMemberPayload): DealershipMember {
    const today = new Date();
    return new DealershipMember({
      ...this.primitive_dealership_member,
      ...payload,
      updated_at: today,
    });
  }

  static fromPrimitives(primitive: PrimitiveDealershipMember): DealershipMember {
    return new DealershipMember(primitive);
  }

  toPrimitives(): PrimitiveDealershipMember {
    return { ...this.primitive_dealership_member };
  }
}