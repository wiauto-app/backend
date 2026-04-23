import { User as AppUser } from "@/src/contexts/users/entities/user.entity"
import "express"
import { Multer } from "multer";

declare global {
  namespace Express {
    interface User extends AppUser {
      id: string
    }

    interface Request {
      user?: User
      file?: Multer.File;
      files?: Multer.File[];
      uploaded_files?: string[];
      uploaded_file: string;
    }
    
  }
}