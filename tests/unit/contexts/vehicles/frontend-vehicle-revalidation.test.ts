import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { envs } from "@/src/common/envs";
import { requestFrontendVehicleRevalidation } from "@/src/contexts/vehicles/services/frontend-vehicle-revalidation";

const vehicle_id = "797f4ef7-08d3-4408-8d22-f8bd985cc3ac";

describe("requestFrontendVehicleRevalidation", () => {
  const original = {
    secret: envs.FRONTEND_REVALIDATE_SECRET,
    url: envs.FRONTEND_REVALIDATE_URL,
  };
  const fetch_mock = vi.fn();

  beforeEach(() => {
    fetch_mock.mockReset().mockResolvedValue(new Response("{}"));
    vi.stubGlobal("fetch", fetch_mock);
  });

  afterEach(() => {
    envs.FRONTEND_REVALIDATE_SECRET = original.secret;
    envs.FRONTEND_REVALIDATE_URL = original.url;
    vi.unstubAllGlobals();
  });

  it("no llama a Next si no hay secreto", async () => {
    envs.FRONTEND_REVALIDATE_SECRET = "";
    await requestFrontendVehicleRevalidation(vehicle_id);
    expect(fetch_mock).not.toHaveBeenCalled();
  });

  it("envía el vehículo con el secreto en cabecera", async () => {
    envs.FRONTEND_REVALIDATE_SECRET = "s3cret";
    envs.FRONTEND_REVALIDATE_URL = "http://next.test/api/revalidate/vehicle";

    await requestFrontendVehicleRevalidation(vehicle_id);

    expect(fetch_mock).toHaveBeenCalledWith(
      "http://next.test/api/revalidate/vehicle",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ vehicle_id }),
        headers: expect.objectContaining({ "x-revalidate-secret": "s3cret" }),
      }),
    );
  });

  it("nunca lanza si Next no responde", async () => {
    envs.FRONTEND_REVALIDATE_SECRET = "s3cret";
    fetch_mock.mockRejectedValue(new Error("ECONNREFUSED"));
    await expect(
      requestFrontendVehicleRevalidation(vehicle_id),
    ).resolves.toBeUndefined();
  });
});
