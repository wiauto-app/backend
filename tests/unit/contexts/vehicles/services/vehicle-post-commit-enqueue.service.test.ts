import { vi } from "vitest";

import { VEHICLE_POST_COMMIT_JOB_PROCESS_MEDIA } from "@/src/contexts/vehicles/queues/vehicle-post-commit.queue.constants";
import { VehiclePostCommitEnqueueService } from "@/src/contexts/vehicles/services/vehicle-post-commit-enqueue.service";

describe("VehiclePostCommitEnqueueService", () => {
  it("usa un jobId sin dos puntos", async () => {
    const add = vi.fn().mockResolvedValue(undefined);
    const queue = { add } as never;
    const service = new VehiclePostCommitEnqueueService(queue);

    const vehicle_id = "797f4ef7-08d3-4408-8d22-f8bd985cc3ac";
    await service.enqueue({
      vehicle_id,
      kind: "create_publish",
      images: [],
      video_ids: [],
      reindex: true,
      warm_cache: true,
    });

    expect(add).toHaveBeenCalledWith(
      VEHICLE_POST_COMMIT_JOB_PROCESS_MEDIA,
      expect.objectContaining({ vehicle_id }),
      expect.objectContaining({
        jobId: `vehicle-post-commit-${vehicle_id}`,
      }),
    );
  });

  it("usa jobId único cuando hay imágenes o vídeos pendientes", async () => {
    const add = vi.fn().mockResolvedValue(undefined);
    const queue = { add } as never;
    const service = new VehiclePostCommitEnqueueService(queue);

    const vehicle_id = "797f4ef7-08d3-4408-8d22-f8bd985cc3ac";
    const image_id = "152407d6-035b-425a-85ea-b2dc0e8d9df8";
    await service.enqueue({
      vehicle_id,
      kind: "update",
      images: [
        {
          image_id,
          upload_id: "d2959730-1cf2-4cfd-9810-27653330c191",
          order: 0,
        },
      ],
      video_ids: [],
      reindex: true,
      warm_cache: true,
    });

    const job_options = add.mock.calls[0][2] as { jobId: string };
    expect(job_options.jobId).toMatch(
      new RegExp(`^vehicle-post-commit-${vehicle_id}-\\d+$`),
    );
  });
});