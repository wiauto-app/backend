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
});