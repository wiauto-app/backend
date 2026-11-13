import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
  ServiceUnavailableException,
  UnprocessableEntityException,
} from "@nestjs/common";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/src/contexts/shared/file/video/ffprobe", () => ({
  probeVideo: vi.fn(),
}));
// Evita cargar todo el grafo de billing (solo se usa como token de DI)
vi.mock("@/src/contexts/billing/services/entitlements.service", () => ({
  EntitlementsService: class EntitlementsService {
    assertCanUploadVideos = vi.fn();
  },
}));

import { probeVideo } from "@/src/contexts/shared/file/video/ffprobe";
import { VEHICLE_VIDEO_PART_SIZE } from "@/src/contexts/shared/file/media.constants";
import {
  VIDEO_UPLOAD_SESSION_STATUS,
  type VideoUploadSessionEntity,
} from "@/src/contexts/vehicles/vehicle-videos/entities/video-upload-session.entity";
import { VideoUploadService } from "@/src/contexts/vehicles/vehicle-videos/services/video-upload.service";

const PROFILE_ID = "7b4f6a2e-1c3d-4e5f-8a9b-0c1d2e3f4a5b";
const OTHER_PROFILE_ID = "1a2b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d";
const UPLOAD_ID = "9c8b7a6d-5e4f-4321-8abc-def012345678";

const buildSession = (
  overrides: Partial<VideoUploadSessionEntity> = {},
): VideoUploadSessionEntity =>
  ({
    id: UPLOAD_ID,
    profile_id: PROFILE_ID,
    storage_key: `vehicles-videos/temp/${PROFILE_ID}/${UPLOAD_ID}/original.mp4`,
    multipart_upload_id: "s3-upload-id",
    mime_type: "video/mp4",
    original_filename: "coche.mp4",
    size_bytes: 25 * 1024 * 1024,
    part_size: VEHICLE_VIDEO_PART_SIZE,
    part_count: 3,
    duration_s: null,
    width: null,
    height: null,
    status: VIDEO_UPLOAD_SESSION_STATUS.INITIATED,
    expires_at: new Date(Date.now() + 60_000),
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  }) as VideoUploadSessionEntity;

const setup = (session: VideoUploadSessionEntity | null = buildSession()) => {
  const repository = {
    create: vi.fn((value: unknown) => value),
    save: vi.fn((value: unknown) => Promise.resolve(value)),
    findOne: vi.fn().mockResolvedValue(session),
    find: vi.fn().mockResolvedValue(session ? [session] : []),
    count: vi.fn().mockResolvedValue(0),
    update: vi.fn().mockResolvedValue(),
  };
  const storage = {
    createMultipartUpload: vi.fn().mockResolvedValue("s3-upload-id"),
    signUploadPart: vi.fn(
      (_key: string, _id: string, part: number) =>
        Promise.resolve(`https://r2.example/part-${part}`),
    ),
    listParts: vi.fn().mockResolvedValue([]),
    completeMultipartUpload: vi.fn().mockResolvedValue(),
    abortMultipartUpload: vi.fn().mockResolvedValue(),
    headObjectSize: vi.fn().mockResolvedValue(session?.size_bytes ?? 0),
    signGetObject: vi.fn().mockResolvedValue("https://r2.example/get"),
    deleteObject: vi.fn().mockResolvedValue(),
  };
  const entitlements = {
    assertCanUploadVideos: vi.fn().mockResolvedValue(),
  };
  const service = new VideoUploadService(
    repository as never,
    storage as never,
    entitlements as never,
  );
  return { service, repository, storage, entitlements };
};

const completeAllParts = (count = 3) => ({
  parts: Array.from({ length: count }, (_, index) => ({
    part_number: index + 1,
    etag: `"etag-${index + 1}"`,
  })),
});

describe("VideoUploadService", () => {
  beforeEach(() => {
    vi.mocked(probeVideo).mockReset();
  });

  describe("initUpload", () => {
    it("crea la sesión multipart con key propia y calcula las partes", async () => {
      const { service, storage, repository } = setup();

      const result = await service.initUpload(
        { profile_id: PROFILE_ID, is_admin: false },
        { mime_type: "video/quicktime", size_bytes: 25 * 1024 * 1024 },
      );

      expect(result.part_size).toBe(VEHICLE_VIDEO_PART_SIZE);
      expect(result.part_count).toBe(3);
      const key = storage.createMultipartUpload.mock.calls[0][0] as string;
      expect(key).toMatch(
        new RegExp(
          `^vehicles-videos/temp/${PROFILE_ID}/${result.upload_id}/original\\.mov$`,
        ),
      );
      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          profile_id: PROFILE_ID,
          storage_key: key,
          status: "initiated",
        }),
      );
    });

    it("exige el entitlement de vídeos salvo a los admins", async () => {
      const { service, entitlements } = setup();
      entitlements.assertCanUploadVideos.mockRejectedValue(
        new ForbiddenException("sin vídeos"),
      );

      await expect(
        service.initUpload(
          { profile_id: PROFILE_ID, is_admin: false },
          { mime_type: "video/mp4", size_bytes: 1024 },
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);

      await expect(
        service.initUpload(
          { profile_id: PROFILE_ID, is_admin: true },
          { mime_type: "video/mp4", size_bytes: 1024 },
        ),
      ).resolves.toMatchObject({ part_count: 1 });
    });

    it("rechaza formatos que no son vídeo y tamaños > 300 MB", async () => {
      const { service } = setup();
      const actor = { profile_id: PROFILE_ID, is_admin: false };

      await expect(
        service.initUpload(actor, { mime_type: "image/png", size_bytes: 10 }),
      ).rejects.toBeInstanceOf(BadRequestException);
      await expect(
        service.initUpload(actor, {
          mime_type: "video/mp4",
          size_bytes: 301 * 1024 * 1024,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it("limita las sesiones activas por perfil", async () => {
      const { service, repository } = setup();
      repository.count.mockResolvedValue(10);

      await expect(
        service.initUpload(
          { profile_id: PROFILE_ID, is_admin: false },
          { mime_type: "video/mp4", size_bytes: 10 },
        ),
      ).rejects.toMatchObject({ status: 429 });
    });
  });

  describe("getPartUrls", () => {
    it("firma solo partes dentro de rango y sin duplicados", async () => {
      const { service, storage } = setup();

      const result = await service.getPartUrls(UPLOAD_ID, PROFILE_ID, [2, 1, 2]);

      expect(result.urls.map((url) => url.part_number)).toEqual([1, 2]);
      expect(storage.signUploadPart).toHaveBeenCalledTimes(2);
      await expect(
        service.getPartUrls(UPLOAD_ID, PROFILE_ID, [4]),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it("no revela sesiones de otro perfil", async () => {
      const { service } = setup();
      await expect(
        service.getPartUrls(UPLOAD_ID, OTHER_PROFILE_ID, [1]),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it("rechaza sesiones caducadas", async () => {
      const { service } = setup(
        buildSession({ expires_at: new Date(Date.now() - 1000) }),
      );
      await expect(
        service.getPartUrls(UPLOAD_ID, PROFILE_ID, [1]),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe("completeUpload", () => {
    it("completa, verifica tamaño y duración y marca uploaded", async () => {
      const { service, storage, repository } = setup();
      vi.mocked(probeVideo).mockResolvedValue({
        has_video: true,
        has_audio: true,
        duration_s: 42,
        width: 1080,
        height: 1920,
        video_codec: "hevc",
        is_hdr: true,
      });

      const result = await service.completeUpload(
        UPLOAD_ID,
        PROFILE_ID,
        completeAllParts(),
      );

      expect(storage.completeMultipartUpload).toHaveBeenCalledWith(
        expect.any(String),
        "s3-upload-id",
        completeAllParts().parts,
      );
      expect(result).toMatchObject({
        status: "uploaded",
        duration_s: 42,
        width: 1080,
        height: 1920,
      });
      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: "uploaded", duration_s: 42 }),
      );
    });

    it("exige todas las partes", async () => {
      const { service, storage } = setup();
      await expect(
        service.completeUpload(UPLOAD_ID, PROFILE_ID, completeAllParts(2)),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(storage.completeMultipartUpload).not.toHaveBeenCalled();
    });

    it("rechaza vídeos de más de 120 s y borra el objeto", async () => {
      const { service, storage, repository } = setup();
      vi.mocked(probeVideo).mockResolvedValue({
        has_video: true,
        has_audio: false,
        duration_s: 180,
        width: 1920,
        height: 1080,
        video_codec: "h264",
        is_hdr: false,
      });

      await expect(
        service.completeUpload(UPLOAD_ID, PROFILE_ID, completeAllParts()),
      ).rejects.toBeInstanceOf(UnprocessableEntityException);
      expect(storage.deleteObject).toHaveBeenCalled();
      expect(repository.update).toHaveBeenCalledWith(UPLOAD_ID, {
        status: "aborted",
      });
    });

    it("si ffprobe no está instalado responde 503 y conserva el vídeo", async () => {
      const { service, storage, repository } = setup();
      vi.mocked(probeVideo).mockRejectedValue(
        Object.assign(new Error("spawn ffprobe ENOENT"), { code: "ENOENT" }),
      );

      await expect(
        service.completeUpload(UPLOAD_ID, PROFILE_ID, completeAllParts()),
      ).rejects.toBeInstanceOf(ServiceUnavailableException);
      expect(storage.deleteObject).not.toHaveBeenCalled();
      expect(repository.update).not.toHaveBeenCalled();
    });

    it("rechaza archivos que ffprobe no puede leer", async () => {
      const { service, storage } = setup();
      vi.mocked(probeVideo).mockRejectedValue(
        new Error("ffprobe terminó con código 1: Invalid data"),
      );

      await expect(
        service.completeUpload(UPLOAD_ID, PROFILE_ID, completeAllParts()),
      ).rejects.toBeInstanceOf(UnprocessableEntityException);
      expect(storage.deleteObject).toHaveBeenCalled();
    });

    it("al reintentar acepta un multipart ya completado en R2", async () => {
      const { service, storage } = setup();
      storage.completeMultipartUpload.mockRejectedValue(
        Object.assign(new Error("NoSuchUpload"), { name: "NoSuchUpload" }),
      );
      vi.mocked(probeVideo).mockResolvedValue({
        has_video: true,
        has_audio: true,
        duration_s: 20,
        width: 1920,
        height: 1080,
        video_codec: "h264",
        is_hdr: false,
      });

      await expect(
        service.completeUpload(UPLOAD_ID, PROFILE_ID, completeAllParts()),
      ).resolves.toMatchObject({ status: "uploaded", duration_s: 20 });
    });

    it("rechaza archivos cuyo tamaño no coincide", async () => {
      const { service, storage } = setup();
      storage.headObjectSize.mockResolvedValue(123);

      await expect(
        service.completeUpload(UPLOAD_ID, PROFILE_ID, completeAllParts()),
      ).rejects.toBeInstanceOf(UnprocessableEntityException);
      expect(probeVideo).not.toHaveBeenCalled();
    });

    it("es idempotente si la sesión ya está completada", async () => {
      const { service, storage } = setup(
        buildSession({
          status: VIDEO_UPLOAD_SESSION_STATUS.UPLOADED,
          duration_s: 30,
        }),
      );

      const result = await service.completeUpload(
        UPLOAD_ID,
        PROFILE_ID,
        completeAllParts(),
      );
      expect(result.duration_s).toBe(30);
      expect(storage.completeMultipartUpload).not.toHaveBeenCalled();
    });
  });

  describe("validateForVehicle", () => {
    it("acepta sesiones uploaded del perfil", async () => {
      const session = buildSession({
        status: VIDEO_UPLOAD_SESSION_STATUS.UPLOADED,
      });
      const { service } = setup(session);

      await expect(
        service.validateForVehicle([UPLOAD_ID], PROFILE_ID),
      ).resolves.toEqual([session]);
    });

    it("rechaza sesiones ajenas, sin terminar o consumidas", async () => {
      const uploaded = buildSession({
        status: VIDEO_UPLOAD_SESSION_STATUS.UPLOADED,
      });
      await expect(
        setup(uploaded).service.validateForVehicle([UPLOAD_ID], OTHER_PROFILE_ID),
      ).rejects.toBeInstanceOf(BadRequestException);

      await expect(
        setup(buildSession()).service.validateForVehicle([UPLOAD_ID], PROFILE_ID),
      ).rejects.toBeInstanceOf(BadRequestException);

      await expect(
        setup(
          buildSession({ status: VIDEO_UPLOAD_SESSION_STATUS.CONSUMED }),
        ).service.validateForVehicle([UPLOAD_ID], PROFILE_ID),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe("abortUpload", () => {
    it("aborta el multipart abierto", async () => {
      const { service, storage, repository } = setup();
      await service.abortUpload(UPLOAD_ID, PROFILE_ID);
      expect(storage.abortMultipartUpload).toHaveBeenCalled();
      expect(repository.update).toHaveBeenCalledWith(UPLOAD_ID, {
        status: "aborted",
      });
    });

    it("no toca vídeos ya asociados a un anuncio", async () => {
      const { service, storage, repository } = setup(
        buildSession({ status: VIDEO_UPLOAD_SESSION_STATUS.CONSUMED }),
      );
      await service.abortUpload(UPLOAD_ID, PROFILE_ID);
      expect(storage.deleteObject).not.toHaveBeenCalled();
      expect(repository.update).not.toHaveBeenCalled();
    });
  });
});
