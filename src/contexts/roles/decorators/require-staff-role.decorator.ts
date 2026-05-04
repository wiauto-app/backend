import { SetMetadata } from "@nestjs/common";

import { REQUIRE_STAFF_ROLE_METADATA_KEY } from "../constants/staff-role-metadata.constant";

/** Solo roles con `is_admin` o `is_developer` en `roles`. Usar con `JwtGuard` + `StaffRoleGuard`. */
export const RequireStaffRole = () => SetMetadata(REQUIRE_STAFF_ROLE_METADATA_KEY, true);
