import { describe, expect, it } from "vitest";

import {
  is_temp_storage_path,
  promote_temp_storage_path,
} from "@/src/contexts/shared/file/domain/temp-storage-path";

describe("temp-storage-path", () => {
  it("promueve bucket/temp/clave", () => {
    expect(
      promote_temp_storage_path(
        "vehicles-images/temp/vehicle-gallery/photo.jpeg",
      ),
    ).toBe("vehicles-images/vehicle-gallery/photo.jpeg");
  });

  it("promueve temp/bucket/clave", () => {
    expect(
      promote_temp_storage_path(
        "/temp/vehicles-images/vehicle-gallery/photo.jpeg",
      ),
    ).toBe("vehicles-images/vehicle-gallery/photo.jpeg");
  });

  it("detecta rutas temporales", () => {
    expect(
      is_temp_storage_path("vehicles-images/temp/vehicle-gallery/x.jpg"),
    ).toBe(true);
    expect(is_temp_storage_path("vehicles-images/vehicle-gallery/x.jpg")).toBe(
      false,
    );
  });
});
