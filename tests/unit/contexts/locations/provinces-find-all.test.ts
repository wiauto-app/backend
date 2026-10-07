import { describe, expect, it, vi } from "vitest";

import { ProvincesService } from "@/src/contexts/locations/provinces/services/provinces.service";
import { Province } from "@/src/contexts/locations/provinces/types/province";

describe("ProvincesService.findAll", () => {
  it("pasa cod_ccaa al repositorio cuando viene en la query", async () => {
    const find_all = vi.fn().mockResolvedValue({
      map: (fn: (p: Province) => unknown) => [],
    });
    const service = new ProvincesService({
      find_all,
    } as never);

    await service.findAll({
      page: 1,
      limit: 10,
      cod_ccaa: "13",
    });

    expect(find_all).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1, limit: 10 }),
      { cod_ccaa: "13" },
    );
  });

  it("no filtra por cod_ccaa si el parámetro está vacío", async () => {
    const find_all = vi.fn().mockResolvedValue({
      map: () => [],
    });
    const service = new ProvincesService({
      find_all,
    } as never);

    await service.findAll({
      page: 1,
      limit: 10,
      cod_ccaa: "   ",
    });

    expect(find_all).toHaveBeenCalledWith(
      expect.anything(),
      { cod_ccaa: undefined },
    );
  });
});
