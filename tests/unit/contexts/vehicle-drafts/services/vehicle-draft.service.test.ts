import { BadRequestException } from "@nestjs/common";
import { QueryFailedError } from "typeorm";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  VEHICLE_DRAFT_MAX_VALUES_BYTES,
  VEHICLE_DRAFT_TTL_MS,
} from "@/src/contexts/vehicle-drafts/constants/vehicle-draft.constants";
import { VehicleDraftService } from "@/src/contexts/vehicle-drafts/services/vehicle-draft.service";

const buildService = () => {
  const vehicleDraftRepository = {
    findOneBy: vi.fn(),
    findOneByOrFail: vi.fn(),
    create: vi.fn((data: Record<string, unknown>) => data),
    save: vi.fn((data: Record<string, unknown>) =>
      Promise.resolve({ id: "draft-1", ...data }),
    ),
    preload: vi.fn((data: Record<string, unknown>) => Promise.resolve(data)),
    delete: vi.fn().mockResolvedValue(),
  };

  const service = new VehicleDraftService(vehicleDraftRepository as never);

  return { service, vehicleDraftRepository };
};

const buildUniqueViolation = () =>
  new QueryFailedError("INSERT", [], { code: "23505" } as unknown as Error);

describe("VehicleDraftService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("findMine", () => {
    it("devuelve null si no hay borrador", async () => {
      const { service, vehicleDraftRepository } = buildService();
      vehicleDraftRepository.findOneBy.mockResolvedValue(null);

      await expect(service.findMine("profile-1")).resolves.toBeNull();
      expect(vehicleDraftRepository.delete).not.toHaveBeenCalled();
    });

    it("devuelve el borrador vigente", async () => {
      const { service, vehicleDraftRepository } = buildService();
      const draft = {
        id: "draft-1",
        profile_id: "profile-1",
        updated_at: new Date(),
      };
      vehicleDraftRepository.findOneBy.mockResolvedValue(draft);

      await expect(service.findMine("profile-1")).resolves.toBe(draft);
      expect(vehicleDraftRepository.findOneBy).toHaveBeenCalledWith({
        profile_id: "profile-1",
      });
    });

    it("borra y devuelve null si el borrador caducó", async () => {
      const { service, vehicleDraftRepository } = buildService();
      vehicleDraftRepository.findOneBy.mockResolvedValue({
        id: "draft-1",
        profile_id: "profile-1",
        updated_at: new Date(Date.now() - VEHICLE_DRAFT_TTL_MS - 1000),
      });

      await expect(service.findMine("profile-1")).resolves.toBeNull();
      expect(vehicleDraftRepository.delete).toHaveBeenCalledWith({
        id: "draft-1",
      });
    });
  });

  describe("upsertMine", () => {
    it("crea una fila nueva si no existe", async () => {
      const { service, vehicleDraftRepository } = buildService();
      vehicleDraftRepository.findOneBy.mockResolvedValue(null);

      await service.upsertMine("profile-1", { values: { title: "Mi coche" } });

      expect(vehicleDraftRepository.create).toHaveBeenCalledWith({
        profile_id: "profile-1",
        values: { title: "Mi coche" },
        step: null,
        appraisal_id: null,
      });
      expect(vehicleDraftRepository.save).toHaveBeenCalledTimes(1);
      expect(vehicleDraftRepository.preload).not.toHaveBeenCalled();
    });

    it("actualiza con preload y save cuando ya existe", async () => {
      const { service, vehicleDraftRepository } = buildService();
      vehicleDraftRepository.findOneBy.mockResolvedValue({
        id: "draft-1",
        profile_id: "profile-1",
      });

      await service.upsertMine("profile-1", {
        values: { price: 10_000 },
        step: 2,
        appraisal_id: null,
      });

      expect(vehicleDraftRepository.preload).toHaveBeenCalledWith({
        id: "draft-1",
        values: { price: 10_000 },
        step: 2,
        appraisal_id: null,
      });
      expect(vehicleDraftRepository.save).toHaveBeenCalledTimes(1);
      expect(vehicleDraftRepository.create).not.toHaveBeenCalled();
    });

    it("no pisa step ni appraisal_id si no se envían", async () => {
      const { service, vehicleDraftRepository } = buildService();
      vehicleDraftRepository.findOneBy.mockResolvedValue({ id: "draft-1" });

      await service.upsertMine("profile-1", { values: { price: 1 } });

      expect(vehicleDraftRepository.preload).toHaveBeenCalledWith({
        id: "draft-1",
        values: { price: 1 },
      });
    });

    it("actualiza la fila creada en paralelo si el insert choca con el unique", async () => {
      const { service, vehicleDraftRepository } = buildService();
      vehicleDraftRepository.findOneBy.mockResolvedValue(null);
      vehicleDraftRepository.save
        .mockRejectedValueOnce(buildUniqueViolation())
        .mockImplementationOnce((data: Record<string, unknown>) =>
          Promise.resolve(data),
        );
      vehicleDraftRepository.findOneByOrFail.mockResolvedValue({
        id: "draft-2",
      });

      const result = await service.upsertMine("profile-1", {
        values: { price: 1 },
      });

      expect(result).toMatchObject({ id: "draft-2", values: { price: 1 } });
      expect(vehicleDraftRepository.preload).toHaveBeenCalledWith({
        id: "draft-2",
        values: { price: 1 },
      });
    });

    it("rechaza values de más de 200 KB medidos en bytes", async () => {
      const { service, vehicleDraftRepository } = buildService();
      // "ñ" ocupa 2 bytes en UTF-8: pasa el límite en bytes aunque no en caracteres
      const note = "ñ".repeat(VEHICLE_DRAFT_MAX_VALUES_BYTES / 2);

      await expect(
        service.upsertMine("profile-1", { values: { note } }),
      ).rejects.toThrow(BadRequestException);
      expect(vehicleDraftRepository.findOneBy).not.toHaveBeenCalled();
    });
  });

  it("removeMine borra por profile_id", async () => {
    const { service, vehicleDraftRepository } = buildService();

    await service.removeMine("profile-1");

    expect(vehicleDraftRepository.delete).toHaveBeenCalledWith({
      profile_id: "profile-1",
    });
  });
});
