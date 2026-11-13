import { describe, expect, it } from "vitest";

import { MeResponseDto } from "@/src/contexts/auth/dto/me-response.dto";
import type { User } from "@/src/contexts/users/entities/user.entity";

describe("MeResponseDto.fromUser", () => {
  it("copia phone_code, phone, lat y lng en dealership_membership", () => {
    const user = {
      id: "user-1",
      email: "miembro@example.com",
      is_email_verified: true,
      is_admin: false,
      last_sign_in: null,
      created_at: "2024-01-01T00:00:00.000Z",
      profile: {
        id: "user-1",
        name: "Ana",
        last_name: "López",
        vehicle_lists: [],
      },
    } as User;

    const dto = MeResponseDto.fromUser(user, {
      providers: [],
      has_password: true,
      dealership_membership: {
        dealership_id: "dealer-1",
        dealership_name: "Concesionario",
        member_id: "member-1",
        role: "admin",
        phone_code: "+34",
        phone: "612345678",
        lat: 40.416775,
        lng: -3.70379,
      },
    });

    expect(dto.dealership_membership).toEqual({
      dealership_id: "dealer-1",
      dealership_name: "Concesionario",
      member_id: "member-1",
      role: "admin",
      phone_code: "+34",
      phone: "612345678",
      lat: 40.416775,
      lng: -3.70379,
    });
  });
});
