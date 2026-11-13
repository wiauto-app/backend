import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/src/contexts/shared/file/video/ffprobe", () => ({
  probeVideo: vi.fn(),
}));
vi.mock("@/src/contexts/shared/file/video/run-process", () => ({
  runProcess: vi.fn(),
}));
vi.mock("@/src/contexts/shared/file/video/ffmpeg-capabilities", () => ({
  getFfmpegCapabilities: vi.fn(),
}));

import { ProcessVehicleVideoProcessor } from "@/src/contexts/shared/file/processors/process-vehicle-video.processor";
import { probeVideo } from "@/src/contexts/shared/file/video/ffprobe";
import { runProcess } from "@/src/contexts/shared/file/video/run-process";
import { getFfmpegCapabilities } from "@/src/contexts/shared/file/video/ffmpeg-capabilities";

const vehicle_id = "797f4ef7-08d3-4408-8d22-f8bd985cc3ac";
const video_id = "223ac813-eb7e-4c0e-9dc4-f8d89c365286";
const source_key = `vehicles-videos/${vehicle_id}/${video_id}/original.mov`;

const probe = {
  has_video: true,
  has_audio: true,
  duration_s: 30,
  width: 1080,
  height: 1920,
  video_codec: "hevc",
  is_hdr: true,
};

const setup = (status = "uploaded") => {
  const repository = {
    findOne: vi.fn().mockResolvedValue({ id: video_id, vehicle_id, status }),
    update: vi.fn().mockResolvedValue(),
  };
  const storage = {
    downloadToFile: vi.fn().mockResolvedValue(),
    uploadFromFile: vi.fn().mockResolvedValue(),
  };
  const objectStorage = {
    buildPublicUrl: vi.fn((key: string) => `https://media.example/${key}`),
  };
  const cache = { invalidate: vi.fn().mockResolvedValue() };
  const processor = new ProcessVehicleVideoProcessor(
    repository as never,
    storage as never,
    objectStorage as never,
    cache as never,
  );
  return { processor, repository, storage, cache };
};

const job = (attemptsMade = 0) =>
  ({
    data: { video_id, vehicle_id, source_key },
    opts: { attempts: 3 },
    attemptsMade,
  }) as never;

describe("ProcessVehicleVideoProcessor", () => {
  beforeEach(() => {
    vi.mocked(probeVideo).mockReset().mockResolvedValue(probe);
    vi.mocked(getFfmpegCapabilities)
      .mockReset()
      .mockResolvedValue({ has_zscale: true, has_libwebp: true });
    vi.mocked(runProcess)
      .mockReset()
      .mockResolvedValue({ stdout: "", stderr: "" });
  });

  it("transcodifica, sube con keys deterministas y marca ready", async () => {
    const { processor, repository, storage, cache } = setup();

    await processor.process(job());

    expect(storage.downloadToFile).toHaveBeenCalledWith(
      source_key,
      expect.any(String),
    );
    const transcode_args = vi.mocked(runProcess).mock.calls[0][1];
    expect(transcode_args.join(" ")).toContain("tonemap");
    expect(storage.uploadFromFile).toHaveBeenCalledWith(
      `vehicles-videos/${vehicle_id}/${video_id}/optimized.mp4`,
      expect.any(String),
      "video/mp4",
    );
    expect(storage.uploadFromFile).toHaveBeenCalledWith(
      `vehicles-videos/${vehicle_id}/${video_id}/thumbnail.webp`,
      expect.any(String),
      "image/webp",
    );
    expect(repository.update).toHaveBeenLastCalledWith(
      video_id,
      expect.objectContaining({
        status: "ready",
        url: `https://media.example/vehicles-videos/${vehicle_id}/${video_id}/optimized.mp4`,
        thumbnail_url: `https://media.example/vehicles-videos/${vehicle_id}/${video_id}/thumbnail.webp`,
      }),
    );
    expect(cache.invalidate).toHaveBeenCalledWith(vehicle_id);
  });

  it("sin libwebp ni zscale genera miniatura JPEG y no hace tone mapping", async () => {
    vi.mocked(getFfmpegCapabilities).mockResolvedValue({
      has_zscale: false,
      has_libwebp: false,
    });
    const { processor, storage, repository } = setup();

    await processor.process(job());

    const transcode_args = vi.mocked(runProcess).mock.calls[0][1];
    expect(transcode_args.join(" ")).not.toContain("tonemap");
    expect(storage.uploadFromFile).toHaveBeenCalledWith(
      `vehicles-videos/${vehicle_id}/${video_id}/thumbnail.jpg`,
      expect.any(String),
      "image/jpeg",
    );
    expect(repository.update).toHaveBeenLastCalledWith(
      video_id,
      expect.objectContaining({
        thumbnail_url: `https://media.example/vehicles-videos/${vehicle_id}/${video_id}/thumbnail.jpg`,
      }),
    );
  });

  it("no reprocesa vídeos ya listos", async () => {
    const { processor, storage } = setup("ready");
    await processor.process(job());
    expect(storage.downloadToFile).not.toHaveBeenCalled();
  });

  it("sigue en processing mientras quedan reintentos y falla en el último", async () => {
    vi.mocked(runProcess).mockRejectedValue(new Error("ffmpeg roto"));

    const first = setup();
    await expect(first.processor.process(job(0))).rejects.toThrow("ffmpeg roto");
    expect(first.repository.update).toHaveBeenLastCalledWith(
      video_id,
      expect.objectContaining({ status: "processing" }),
    );

    const last = setup();
    await expect(last.processor.process(job(2))).rejects.toThrow("ffmpeg roto");
    expect(last.repository.update).toHaveBeenLastCalledWith(
      video_id,
      expect.objectContaining({ status: "failed", failure_reason: expect.stringContaining("ffmpeg roto") }),
    );
  });
});
