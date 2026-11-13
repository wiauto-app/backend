import { describe, expect, it, vi } from "vitest";

import { TypeOrmDealershipMemberRepository } from "@/src/contexts/dealership/repositories/typeorm.dealership-member-repository";

describe("TypeOrmDealershipMemberRepository.findMembershipDetailByProfileId", () => {
  const buildRepository = (entity: object | null) => {
    const dealership_member_entity_repository = {
      findOne: vi.fn().mockResolvedValue(entity),
    };

    return new TypeOrmDealershipMemberRepository(
      dealership_member_entity_repository as never,
    );
  };

  it("devuelve null si no hay membresía", async () => {
    const repository = buildRepository(null);

    await expect(
      repository.findMembershipDetailByProfileId("profile-1"),
    ).resolves.toBeNull();
  });

  it("mapea teléfono y coordenadas desde el concesionario", async () => {
    const repository = buildRepository({
      id: "member-1",
      dealership_id: "dealer-1",
      role: "owner",
      dealership: {
        name: "WiAuto Motors",
        phone_code: "+34",
        phone: "612345678",
        lat: "40.416775" as unknown as number,
        lng: "-3.703790" as unknown as number,
      },
    });

    await expect(
      repository.findMembershipDetailByProfileId("profile-1"),
    ).resolves.toEqual({
      dealership_id: "dealer-1",
      dealership_name: "WiAuto Motors",
      member_id: "member-1",
      role: "owner",
      phone_code: "+34",
      phone: "612345678",
      lat: 40.416775,
      lng: -3.70379,
    });
  });

  it("envía lat y lng como null cuando el concesionario no tiene ubicación", async () => {
    const repository = buildRepository({
      id: "member-2",
      dealership_id: "dealer-2",
      role: "member",
      dealership: {
        name: "Sin mapa",
        phone_code: "+34",
        phone: "600000000",
        lat: null,
        lng: null,
      },
    });

    await expect(
      repository.findMembershipDetailByProfileId("profile-2"),
    ).resolves.toMatchObject({
      lat: null,
      lng: null,
    });
  });
});
