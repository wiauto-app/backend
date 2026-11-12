import { describe, expect, it } from "vitest";
import { validate } from "class-validator";

import { CreateTempUploadHttpDto } from "@/src/contexts/vehicles/vehicle-images/api/v1/temp-upload/create-temp-upload.http-dto";

describe("CreateTempUploadHttpDto", () => {
  it("acepta image/heic", async () => {
    const dto = new CreateTempUploadHttpDto();
    dto.mime_type = "image/heic";
    dto.size_bytes = 1024;
    dto.original_filename = "foto.heic";

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it("rechaza un MIME no admitido", async () => {
    const dto = new CreateTempUploadHttpDto();
    dto.mime_type = "image/svg+xml" as "image/heic";
    dto.size_bytes = 1024;
    dto.original_filename = "logo.svg";

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});
