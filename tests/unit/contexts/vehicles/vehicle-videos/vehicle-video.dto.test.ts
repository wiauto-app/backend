import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { describe, expect, it } from "vitest";

import {
  classifyVehicleVideo,
  VehicleVideoHttpDto,
} from "@/src/contexts/vehicles/api/v1/create-vehicle/vehicleMedia.http-dto";

const UPLOAD_ID = "9c8b7a6d-5e4f-4321-8abc-def012345678";
const VIDEO_ID = "1a2b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d";

const errorsFor = async (plain: Record<string, unknown>) =>
  validate(plainToInstance(VehicleVideoHttpDto, plain));

describe("VehicleVideoHttpDto", () => {
  it("acepta upload_id, id o path legacy", async () => {
    expect(await errorsFor({ upload_id: UPLOAD_ID, order: 0 })).toHaveLength(0);
    expect(await errorsFor({ id: VIDEO_ID, order: 1 })).toHaveLength(0);
    expect(
      await errorsFor({ path: "vehicles-videos/temp/abc.mp4", order: 2 }),
    ).toHaveLength(0);
  });

  it("rechaza un vídeo sin referencia", async () => {
    const errors = await errorsFor({ order: 0 });
    expect(errors.length).toBeGreaterThan(0);
  });

  it("rechaza upload_id no UUID y path no temporal", async () => {
    const bad_upload = await errorsFor({ upload_id: "x", order: 0 });
    const bad_path = await errorsFor({
      path: "vehicles-videos/final.mp4",
      order: 0,
    });
    expect(bad_upload.length).toBeGreaterThan(0);
    expect(bad_path.length).toBeGreaterThan(0);
  });

  it("clasifica con prioridad upload_id > id > path", () => {
    expect(
      classifyVehicleVideo({ upload_id: UPLOAD_ID, id: VIDEO_ID, order: 0 }),
    ).toEqual({ kind: "upload", upload_id: UPLOAD_ID, order: 0 });
    expect(classifyVehicleVideo({ id: VIDEO_ID, order: 3 })).toEqual({
      kind: "existing",
      id: VIDEO_ID,
      order: 3,
    });
    expect(
      classifyVehicleVideo({ path: "vehicles-videos/temp/a.mp4", order: 1 }),
    ).toEqual({ kind: "legacy", path: "vehicles-videos/temp/a.mp4", order: 1 });
  });
});
