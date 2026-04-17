import { Profile } from "../../profiles/entities/profile.entity";
import { User } from "../../users/entities/user.entity";


export interface SessionPayload{
  id:string;
  email:string
}

export interface UserResponse{
  user:User;
  profile:Profile
}