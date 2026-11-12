import { describe, expect, it, vi } from "vitest";

import { ProcessVehicleImageProcessor } from "@/src/contexts/shared/file/processors/process-vehicle-image.processor";

const vehicle_id = "797f4ef7-08d3-4408-8d22-f8bd985cc3ac";
const image_id = "223ac813-eb7e-4c0e-9dc4-f8d89c365286";
const source_path = `vehicles-images/${vehicle_id}/${image_id}.source.heic`;
const output_key = `${vehicle_id}/${image_id}.webp`;

describe("ProcessVehicleImageProcessor", () => {
  it("sube el WebP en la clave canónica y borra el source solo tras éxito", async () => {
    const vehicleImagesRepo = {
      update: vi.fn().mockResolvedValue(undefined),
    };
    const objectStorageService = {
      getObjectBufferByKey: vi.fn().mockResolvedValue(Buffer.from("source")),
      putObjectToBucket: vi.fn().mockResolvedValue(undefined),
      buildPublicUrl: vi
        .fn()
        .mockReturnValue(`https://cdn.example/${output_key}`),
      deleteObjectByKey: vi.fn().mockResolvedValue(undefined),
    };
    const vehicleDetailCache = {
      invalidate: vi.fn().mockResolvedValue(undefined),
    };
    const imageOptimizationPipeline = {
      execute: vi.fn().mockResolvedValue({
        buffer: Buffer.from("webp"),
        contentType: "image/webp",
        extension: ".webp",
      }),
    };

    const processor = new ProcessVehicleImageProcessor(
      vehicleImagesRepo as never,
      objectStorageService as never,
      vehicleDetailCache as never,
      imageOptimizationPipeline as never,
    );

    await processor.process({
      id: "job-1",
      data: {
        image_id,
        vehicle_id,
        source_path,
        output_key,
      },
    } as never);

    expect(objectStorageService.putObjectToBucket).toHaveBeenCalledWith(
      "vehicles-images",
      output_key,
      expect.any(Buffer),
      "image/webp",
    );
    expect(vehicleImagesRepo.update).toHaveBeenLastCalledWith(image_id, {
      status: "ready",
      url: `https://cdn.example/${output_key}`,
      failure_reason: null,
    });
    expect(objectStorageService.deleteObjectByKey).toHaveBeenCalledWith(
      source_path,
    );
  });

  it("no borra el source si falla la optimización", async () => {
    const vehicleImagesRepo = {
      update: vi.fn().mockResolvedValue(undefined),
    };
    const objectStorageService = {
      getObjectBufferByKey: vi.fn().mockResolvedValue(Buffer.from("source")),
      putObjectToBucket: vi.fn(),
      buildPublicUrl: vi.fn(),
      deleteObjectByKey: vi.fn(),
    };
    const vehicleDetailCache = {
      invalidate: vi.fn().mockResolvedValue(undefined),
    };
    const imageOptimizationPipeline = {
      execute: vi.fn().mockRejectedValue(new Error("conversión fallida")),
    };

    const processor = new ProcessVehicleImageProcessor(
      vehicleImagesRepo as never,
      objectStorageService as never,
      vehicleDetailCache as never,
      imageOptimizationPipeline as never,
    );

    await expect(
      processor.process({
        id: "job-2",
        data: { image_id, vehicle_id, source_path, output_key },
      } as never),
    ).rejects.toThrow("conversión fallida");

    expect(objectStorageService.deleteObjectByKey).not.toHaveBeenCalled();
    expect(vehicleImagesRepo.update).toHaveBeenCalledWith(image_id, {
      status: "failed",
      failure_reason: "conversión fallida",
    });
  });
});
