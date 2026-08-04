import { User } from "../../users/entities/user.entity";


export interface SessionPayload {
  id: string;
  email: string;
  session_id: string;
  refreshToken_hash: string;
  scope: "2fa_challenge" | "session";
  /** Solo en reto 2FA: avisar de nuevo inicio tras verificar si hubo last_sign_in previo. */
  notify_new_login?: boolean;
}


export type SignInResult =
  | { type: "session" | "2fa_challenge"; token: string; refresh_token: string };

export interface TwoFactorChallengeResponse {
  verified: boolean;
  user?: User;
  message?: string;
}

export interface TwoFactorEnableResponse extends TwoFactorChallengeResponse {
  backup_codes?: string[];
}
