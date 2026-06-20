import { User as AppUser } from "@/src/contexts/users/entities/user.entity"
import type { SessionPayload } from "@/src/contexts/auth/types/auth.types"
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
      refresh_token?: string;
      auth_session_id?: string;
      auth_scope?: SessionPayload["scope"];
      auth_session_payload?: SessionPayload;
      uploaded_files?: string[];
      uploaded_file: string;
      /** Rellena `VehicleCreationGuard`: anuncios activos del perfil. */
      vehicle_listings_used?: number;
      /** Tope del plan (`value` de `vehicles.create`); undefined en admin/developer. */
      vehicle_listings_max?: number;
      /** Rellena `VehicleOwnerGuard` tras validar ownership. */
      vehicle_owner_vehicle_id?: string;
      /** Rellena guards de membresía de concesionario. */
      dealership_membership?: {
        id: string;
        dealership_id: string;
        profile_id: string;
        role: "owner" | "admin" | "member";
      };
      dealership_member_id?: string;
    }

    
  }
}