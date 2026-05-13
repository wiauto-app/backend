import { uuidv4 } from "@/src/contexts/shared/uuid-generator/uuid-generator";

import { CreateDealershipInvitationPayload } from "../payloads/dealership-invitations/dealership-invitations.payload";
import { UpdateDealershipInvitationPayload } from "../payloads/dealership-invitations/update-dealership-invitations.payload";

export interface PrimitiveDealershipInvitation {
  id: string;
  email: string;
  role: "owner" | "admin" | "member";
  token_hash: string;
  status: "pending" | "accepted" | "revoked" | "expired";
  expires_at: Date;
  accepted_at: Date | null;
  created_at: Date;
  updated_at: Date;
  invited_by_id: string;
  dealership_id: string;
}

export class DealershipInvitation {
  constructor(private readonly primitive_dealership_invitation: PrimitiveDealershipInvitation) {}

  get email(): string {
    return this.primitive_dealership_invitation.email;
  }

  get dealership_id(): string {
    return this.primitive_dealership_invitation.dealership_id;
  }

  get role(): "owner" | "admin" | "member" {
    return this.primitive_dealership_invitation.role;
  }

  static create(payload: CreateDealershipInvitationPayload): DealershipInvitation {
    return new DealershipInvitation({
      id: uuidv4(),
      email: payload.email,
      role: payload.role,
      token_hash: payload.token_hash,
      status: payload.status,
      expires_at: payload.expires_at,
      accepted_at: payload.accepted_at,
      created_at: new Date(),
      updated_at: new Date(),
      invited_by_id: payload.invited_by_id,
      dealership_id: payload.dealership_id,
    });
  }

  update(payload: UpdateDealershipInvitationPayload): DealershipInvitation {
    return new DealershipInvitation({
      ...this.primitive_dealership_invitation,
      ...payload,
      updated_at: new Date(),
    });
  }

  static fromPrimitives(primitive: PrimitiveDealershipInvitation): DealershipInvitation {
    return new DealershipInvitation(primitive);
  }

  toPrimitives(): PrimitiveDealershipInvitation {
    return { ...this.primitive_dealership_invitation };
  }

  is_expired(): boolean {
    return this.primitive_dealership_invitation.expires_at < new Date();
  }

  is_accepted(): boolean {
    return this.primitive_dealership_invitation.accepted_at !== null;
  }

  is_revoked(): boolean {
    return this.primitive_dealership_invitation.status === "revoked";
  }
  
}