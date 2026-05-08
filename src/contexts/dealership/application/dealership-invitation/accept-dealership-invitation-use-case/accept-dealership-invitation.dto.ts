import { hashToken } from "@/src/contexts/shared/token_management/hash_token";


export class AcceptDealershipInvitationDto {
  token: string;

  get_hashed_token (): string {
    return hashToken(this.token);
  }
}