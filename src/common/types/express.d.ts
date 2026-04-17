import { User as AppUser } from "@/src/contexts/users/entities/user.entity"
import "express"

declare global {
  namespace Express {
    interface User extends AppUser {
      id:string
    }

    interface Request {
      user?: User
    }
  }
}