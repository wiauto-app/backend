import { beforeEach, describe, expect, it, vi } from "vitest";
import { BadRequestException } from "@nestjs/common";

import { GenerateVehicleDescriptionService } from "@/src/contexts/vehicles/services/generate-vehicle-description.service";
import type { GenerateVehicleDescriptionDto } from "@/src/contexts/vehicles/dto/generate-vehicle-description.dto";

const particularContext = (): GenerateVehicleDescriptionDto => ({
  version_id: 12345,
  condition: "used",
  mileage: 42000,
  transmission_type: "manual",
  publisher_type: "particular",
});

describe("GenerateVehicleDescriptionService", () => {
  const context_resolver = {
    resolve: vi.fn(),
  };
  const prompt_service = {
    generateDescription: vi.fn(),
  };
  const cache_manager = {
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
  };

  let service: GenerateVehicleDescriptionService;

  beforeEach(() => {
    vi.clearAllMocks();
    cache_manager.get.mockResolvedValue(null);
    context_resolver.resolve.mockResolvedValue({
      make_name: "Seat",
      model_name: "León",
      year: 2019,
      fuel_type_name: "Gasolina",
      version_name: "1.5 TSI",
      condition: "used",
      mileage: 42000,
      transmission_type: "manual",
    });
    prompt_service.generateDescription.mockResolvedValue(
      "Seat León en buen estado.",
    );

    service = new GenerateVehicleDescriptionService(
      context_resolver as never,
      prompt_service as never,
      cache_manager as never,
    );
  });

  it("genera descripción con el contexto mínimo de un particular", async () => {
    const result = await service.execute(particularContext(), "user-1");

    expect(result.description).toBe("Seat León en buen estado.");
    expect(context_resolver.resolve).toHaveBeenCalledOnce();
    expect(prompt_service.generateDescription).toHaveBeenCalledOnce();
  });

  it("acepta mileage 0 (vehículo a estrenar)", async () => {
    await expect(
      service.execute(
        { ...particularContext(), mileage: 0, condition: "new" },
        "user-1",
      ),
    ).resolves.toEqual({ description: "Seat León en buen estado." });
  });

  it("rechaza version_id vacío del formulario", async () => {
    await expect(
      service.execute({ ...particularContext(), version_id: 0 }, "user-1"),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("rechaza cuando falta mileage", async () => {
    await expect(
      service.execute(
        {
          ...particularContext(),
          mileage: undefined as unknown as number,
        },
        "user-1",
      ),
    ).rejects.toThrow(/mileage/);
  });
});
