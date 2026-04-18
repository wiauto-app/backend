import { Profile } from "../../profiles/entities/profile.entity";
import { User } from "../../users/entities/user.entity";


export interface SessionPayload{
  id:string;
  email:string;
  scope: "2fa_challenge" | "session"
}

export interface UserResponse{
  user:User;
  profile:Profile
}

export type SignInResult =
  | { type: "session"; token: string }
  | { type: "2fa_required"; challenge_token: string };

export interface TwoFactorChallengeResponse{
  verified:boolean;
  user?:User;
  message?:string;
}

export interface TwoFactorEnableResponse extends TwoFactorChallengeResponse{
  backup_codes?:string[];
}