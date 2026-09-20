import { ForbiddenException, UnauthorizedException } from "@nestjs/common";
import type { ExecutionContext } from "@nestjs/common";
import { beforeEach, describe, expect, it, vi } from "vitest";

// El repositorio arrastra entidades TypeORM con `require` circulares que no cargan bajo
// vitest; el guard solo necesita el token de inyección.
vi.mock(
  "@/src/contexts/dealership/repositories/typeorm.dealership-member-repository",
  () => ({ TypeOrmDealershipMemberRepository: vi.fn() }),
);

import { DealershipOwnerGuard } from "@/src/contexts/dealership/guards/dealership-owner.guard";

const DEALERSHIP_ID = "6f1f1d5e-7f3b-4d1a-9d0e-0c6a5f2b3c41";

const buildContext = (user: unknown, id = DEALERSHIP_ID) =>
  ({
    switchToHttp: () => ({
      getRequest: () => ({ user, params: { id } }),
    }),
  }) as unknown as ExecutionContext;

const buildGuard = (owner: { profile_id: string } | null) => {
  const member_repository = {
    findOwnerMemberByDealershipId: vi.fn().mockResolvedValue(owner),
  };
  const guard = new DealershipOwnerGuard(member_repository as never);
  return { guard, member_repository };
};

describe("DealershipOwnerGuard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rechaza si no hay usuario autenticado", async () => {
    const { guard } = buildGuard(null);

    await expect(guard.canActivate(buildContext(undefined))).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it("permite al propietario del concesionario de la ruta", async () => {
    const { guard, member_repository } = buildGuard({ profile_id: "profile-1" });

    await expect(
      guard.canActivate(buildContext({ profile: { id: "profile-1" } })),
    ).resolves.toBe(true);
    expect(member_repository.findOwnerMemberByDealershipId).toHaveBeenCalledWith(
      DEALERSHIP_ID,
      "owner",
    );
  });

  it("rechaza a quien es propietario de OTRO concesionario", async () => {
    const { guard } = buildGuard({ profile_id: "profile-owner-of-b" });

    await expect(
      guard.canActivate(buildContext({ profile: { id: "profile-1" } })),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("rechaza si el concesionario no tiene propietario", async () => {
    const { guard } = buildGuard(null);

    await expect(
      guard.canActivate(buildContext({ profile: { id: "profile-1" } })),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("permite a un admin de la plataforma sin consultar membresías", async () => {
    const { guard, member_repository } = buildGuard(null);

    await expect(
      guard.canActivate(buildContext({ is_admin: true, profile: { id: "admin-1" } })),
    ).resolves.toBe(true);
    expect(member_repository.findOwnerMemberByDealershipId).not.toHaveBeenCalled();
  });
});
