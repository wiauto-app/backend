import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/src/contexts/shared/object-storage/object-storage.service", () => ({
  ObjectStorageService: class ObjectStorageService {},
}));

import {
  ProfileService,
  resolveOwnedAvatarObjectKey,
} from "@/src/contexts/profiles/services/profile.service";

const PROFILE_ID = "8f9b5c1e-4a1f-4f6a-9d6b-1a2b3c4d5e6f";
const OWNED_AVATAR = `profile-images/avatars/${PROFILE_ID}/avatar-123.webp`;

const buildProfile = (avatar_url: string | null) => ({
  id: PROFILE_ID,
  name: "Andrea",
  last_name: "Gutiérrez",
  avatar_url,
  image_url: null,
  phone_code: null,
  phone: null,
  province_id: null,
  user: {
    id: PROFILE_ID,
    email: "andrea@example.com",
    password: null,
    last_sign_in: null,
  },
});

const buildService = (options: {
  before: string | null;
  after: string | null;
  delete_error?: Error;
}) => {
  const profile_repository = {
    findOne: vi
      .fn()
      .mockResolvedValueOnce(buildProfile(options.before))
      .mockResolvedValueOnce(buildProfile(options.after)),
    findByPhone: vi.fn().mockResolvedValue(null),
    update: vi.fn().mockResolvedValue(buildProfile(options.after)),
  };
  const me_session_cache_service = {
    invalidateByProfileId: vi.fn().mockResolvedValue(undefined),
  };
  const object_storage_service = {
    deleteObjectByKey: options.delete_error
      ? vi.fn().mockRejectedValue(options.delete_error)
      : vi.fn().mockResolvedValue(undefined),
  };

  const service = new ProfileService(
    profile_repository as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    me_session_cache_service as never,
    {} as never,
    object_storage_service as never,
  );

  return {
    service,
    profile_repository,
    me_session_cache_service,
    object_storage_service,
  };
};

describe("ProfileService.updateMyProfile — eliminar avatar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("pasa avatar_url null al repositorio y borra el objeto de R2", async () => {
    const { service, profile_repository, object_storage_service } =
      buildService({ before: OWNED_AVATAR, after: null });

    const response = await service.updateMyProfile(PROFILE_ID, {
      name: "Andrea",
      avatar_url: null,
    });

    expect(profile_repository.update).toHaveBeenCalledWith(
      PROFILE_ID,
      expect.objectContaining({ avatar_url: null }),
    );
    expect(object_storage_service.deleteObjectByKey).toHaveBeenCalledWith(
      OWNED_AVATAR,
    );
    expect(response.avatar_url).toBeUndefined();
  });

  it("no borra nada si no se envía avatar_url", async () => {
    const { service, object_storage_service } = buildService({
      before: OWNED_AVATAR,
      after: OWNED_AVATAR,
    });

    await service.updateMyProfile(PROFILE_ID, { name: "Andrea" });

    expect(object_storage_service.deleteObjectByKey).not.toHaveBeenCalled();
  });

  it("borra el avatar anterior cuando se reemplaza por otro", async () => {
    const new_avatar = `profile-images/avatars/${PROFILE_ID}/avatar-456.webp`;
    const { service, object_storage_service } = buildService({
      before: OWNED_AVATAR,
      after: new_avatar,
    });

    await service.updateMyProfile(PROFILE_ID, { avatar_url: new_avatar });

    expect(object_storage_service.deleteObjectByKey).toHaveBeenCalledWith(
      OWNED_AVATAR,
    );
  });

  it("no borra avatares externos (p. ej. Google)", async () => {
    const { service, object_storage_service } = buildService({
      before: "https://lh3.googleusercontent.com/a/abc=s96-c",
      after: null,
    });

    await service.updateMyProfile(PROFILE_ID, { avatar_url: null });

    expect(object_storage_service.deleteObjectByKey).not.toHaveBeenCalled();
  });

  it("si falla el borrado en R2 igual devuelve el perfil actualizado", async () => {
    const { service, me_session_cache_service } = buildService({
      before: OWNED_AVATAR,
      after: null,
      delete_error: new Error("R2 down"),
    });

    const response = await service.updateMyProfile(PROFILE_ID, {
      avatar_url: null,
    });

    expect(response.avatar_url).toBeUndefined();
    expect(me_session_cache_service.invalidateByProfileId).toHaveBeenCalledWith(
      PROFILE_ID,
    );
  });
});

describe("resolveOwnedAvatarObjectKey", () => {
  it.each([
    [OWNED_AVATAR, OWNED_AVATAR],
    [`/${OWNED_AVATAR}`, OWNED_AVATAR],
    ["profile-images/avatars/otro-perfil/a.webp", null],
    ["vehicles-images/vehicle-gallery/a.webp", null],
    [`profile-images/avatars/${PROFILE_ID}/../otro/a.webp`, null],
    ["https://lh3.googleusercontent.com/a/abc", null],
    ["", null],
    [null, null],
  ])("%s → %s", (input, expected) => {
    expect(resolveOwnedAvatarObjectKey(PROFILE_ID, input)).toBe(expected);
  });
});
