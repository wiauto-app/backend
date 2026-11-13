import { afterEach, describe, expect, it, vi } from "vitest";

import { envs } from "@/src/common/envs";
import { VehicleVideoAttachService } from "@/src/contexts/vehicles/vehicle-videos/services/vehicle-video-attach.service";

const vehicle_id = "797f4ef7-08d3-4408-8d22-f8bd985cc3ac";
const video_id = "223ac813-eb7e-4c0e-9dc4-f8d89c365286";
const temp_key = `vehicles-videos/temp/profile/upload/original.mov`;
const dest_key = `vehicles-videos/${vehicle_id}/${video_id}/original.mov`;

const setup = () => {
  const repository = { update: vi.fn().mockResolvedValue({}) };
  const storage = {
    copyObject: vi.fn().mockResolvedValue(),
    deleteObject: vi.fn().mockResolvedValue(),
  };
  const queue = { addBulk: vi.fn().mockResolvedValue([]) };
  const object_storage = {
    buildPublicUrl: vi.fn((key: string) => `https://media.example/${key}`),
  };
  const service = new VehicleVideoAttachService(
    repository as never,
    storage as never,
    queue as never,
    object_storage as never,
  );
  const video = { id: video_id, vehicle_id, source_key: temp_key } as never;
  return { service, repository, storage, queue, video };
};

describe("VehicleVideoAttachService.relocateAndEnqueue", () => {
  const original = envs.VIDEO_PROCESSING_ENABLED;
  afterEach(() => {
    envs.VIDEO_PROCESSING_ENABLED = original;
  });

  it("con procesamiento apagado publica el original sin encolar", async () => {
    envs.VIDEO_PROCESSING_ENABLED = false;
    const { service, repository, storage, queue, video } = setup();

    await service.relocateAndEnqueue([video]);

    expect(storage.copyObject).toHaveBeenCalledWith(temp_key, dest_key);
    expect(repository.update).toHaveBeenCalledWith(video_id, {
      source_key: dest_key,
      status: "ready",
      url: `https://media.example/${dest_key}`,
      failure_reason: null,
    });
    expect(queue.addBulk).not.toHaveBeenCalled();
  });

  it("con procesamiento encendido encola FFmpeg y deja el vídeo pendiente", async () => {
    envs.VIDEO_PROCESSING_ENABLED = true;
    const { service, repository, queue, video } = setup();

    await service.relocateAndEnqueue([video]);

    expect(repository.update).toHaveBeenCalledWith(video_id, {
      source_key: dest_key,
    });
    expect(queue.addBulk).toHaveBeenCalledWith([
      expect.objectContaining({
        data: { video_id, vehicle_id, source_key: dest_key },
        opts: expect.objectContaining({ jobId: video_id }),
      }),
    ]);
  });
});
