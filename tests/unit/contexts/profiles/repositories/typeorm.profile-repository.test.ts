import { describe, expect, it, vi } from "vitest";

import { TypeOrmProfileRepository } from "@/src/contexts/profiles/repositories/typeorm.profile-repository";

const buildRepository = () => {
  const typeorm_repository = {
    preload: vi.fn(async (entity_like: Record<string, unknown>) => ({
      ...entity_like,
    })),
    save: vi.fn(async (entity: Record<string, unknown>) => entity),
  };
  const repository = new TypeOrmProfileRepository(typeorm_repository as never);
  return { repository, typeorm_repository };
};

describe("TypeOrmProfileRepository.update — avatar_url", () => {
  it("con null deja el avatar vacío", async () => {
    const { repository, typeorm_repository } = buildRepository();

    await repository.update("profile-1", { avatar_url: null });

    expect(typeorm_repository.preload).toHaveBeenCalledWith(
      expect.objectContaining({ id: "profile-1", avatar_url: null }),
    );
  });

  it("con string vacío también lo deja en null", async () => {
    const { repository, typeorm_repository } = buildRepository();

    await repository.update("profile-1", { avatar_url: "" });

    expect(typeorm_repository.preload).toHaveBeenCalledWith(
      expect.objectContaining({ avatar_url: null }),
    );
  });

  it("sin avatar_url no toca el campo", async () => {
    const { repository, typeorm_repository } = buildRepository();

    await repository.update("profile-1", { name: "Andrea" });

    const entity_like = typeorm_repository.preload.mock.calls[0][0];
    expect(entity_like).not.toHaveProperty("avatar_url");
  });

  it("con un path nuevo lo guarda", async () => {
    const { repository, typeorm_repository } = buildRepository();

    await repository.update("profile-1", {
      avatar_url: "profile-images/avatars/profile-1/a.webp",
    });

    expect(typeorm_repository.preload).toHaveBeenCalledWith(
      expect.objectContaining({
        avatar_url: "profile-images/avatars/profile-1/a.webp",
      }),
    );
  });
});
