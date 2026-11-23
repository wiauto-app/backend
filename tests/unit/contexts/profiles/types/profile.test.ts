import { mapProfileToResponse } from "@/src/contexts/profiles/types/profile";

const base_entity = () =>
  ({
    id: "p-1",
    name: "Ana",
    last_name: "García",
    avatar_url: null,
    image_url: null,
    phone_code: "+34",
    phone: "600111222",
    province_id: null,
    user: {
      id: "p-1",
      email: "ana@example.com",
      password: null,
      auth_providers: [],
    },
  }) as Record<string, unknown>;

describe("mapProfileToResponse", () => {
  it("omite dealership y active_grant si no se cargaron", () => {
    const response = mapProfileToResponse(base_entity() as never);

    expect(response).not.toHaveProperty("dealership");
    expect(response).not.toHaveProperty("active_grant");
  });

  it("devuelve null si se cargaron y no hay datos", () => {
    const response = mapProfileToResponse({
      ...base_entity(),
      dealership_members: [],
      active_grant: null,
    } as never);

    expect(response.dealership).toBeNull();
    expect(response.active_grant).toBeNull();
  });

  it("resume concesionario y grant vigente", () => {
    const expires_at = new Date("2027-01-01T00:00:00Z");
    const response = mapProfileToResponse({
      ...base_entity(),
      dealership_members: [
        {
          role: "owner",
          dealership: { id: "d-1", name: "Motor Sur", slug: "motor-sur" },
        },
      ],
      active_grant: {
        plan_id: "plan-1",
        expires_at,
        plan: { name: "Concesionario Pro" },
      },
    } as never);

    expect(response.dealership).toEqual({
      id: "d-1",
      name: "Motor Sur",
      slug: "motor-sur",
      role: "owner",
    });
    expect(response.active_grant).toEqual({
      plan_id: "plan-1",
      plan_name: "Concesionario Pro",
      expires_at,
    });
  });
});
