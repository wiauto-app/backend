import { describe, expect, it } from "vitest";

import {
  buildScaleFilter,
  buildThumbnailArgs,
  buildTranscodeArgs,
  HDR_TO_SDR_FILTER,
  resolveThumbnailSeek,
} from "@/src/contexts/shared/file/video/ffmpeg-args";
import { parseFfprobeOutput } from "@/src/contexts/shared/file/video/ffprobe";

const valueAfter = (args: string[], flag: string): string | undefined =>
  args[args.indexOf(flag) + 1];

describe("buildTranscodeArgs", () => {
  it("genera MP4 H.264/AAC con faststart y escala por lado largo", () => {
    const args = buildTranscodeArgs({
      input: "/tmp/in.mov",
      output: "/tmp/out.mp4",
      is_hdr: false,
    });

    expect(valueAfter(args, "-i")).toBe("/tmp/in.mov");
    expect(valueAfter(args, "-c:v")).toBe("libx264");
    expect(valueAfter(args, "-crf")).toBe("23");
    expect(valueAfter(args, "-preset")).toBe("medium");
    expect(valueAfter(args, "-pix_fmt")).toBe("yuv420p");
    expect(valueAfter(args, "-c:a")).toBe("aac");
    expect(valueAfter(args, "-movflags")).toBe("+faststart");
    expect(valueAfter(args, "-vf")).toBe(buildScaleFilter());
    expect(args).toContain("0:a:0?");
    expect(args.at(-1)).toBe("/tmp/out.mp4");
  });

  it("añade tone mapping a SDR solo para HDR", () => {
    const sdr = buildTranscodeArgs({ input: "a", output: "b", is_hdr: false });
    const hdr = buildTranscodeArgs({ input: "a", output: "b", is_hdr: true });

    expect(valueAfter(sdr, "-vf")).not.toContain("tonemap");
    expect(valueAfter(hdr, "-vf")).toBe(
      `${buildScaleFilter()},${HDR_TO_SDR_FILTER}`,
    );
  });

  it("el filtro de escala no agranda y respeta verticales (1920 en el lado largo)", () => {
    const filter = buildScaleFilter(1920);
    expect(filter).toContain("if(gte(iw,ih),trunc(min(1920,iw)/2)*2,-2)");
    expect(filter).toContain("if(gte(iw,ih),-2,trunc(min(1920,ih)/2)*2)");
  });
});

describe("buildThumbnailArgs", () => {
  it("extrae un frame WebP de 640 px", () => {
    const args = buildThumbnailArgs({
      input: "in",
      output: "thumb.webp",
      duration_s: 30,
      is_hdr: false,
    });
    expect(valueAfter(args, "-ss")).toBe("2.00");
    expect(valueAfter(args, "-frames:v")).toBe("1");
    expect(valueAfter(args, "-vf")).toBe("scale=640:-2");
    expect(valueAfter(args, "-c:v")).toBe("libwebp");
  });

  it("en vídeos cortos busca la mitad de la duración", () => {
    expect(resolveThumbnailSeek(1)).toBe(0.5);
    expect(resolveThumbnailSeek(null)).toBe(0);
    expect(resolveThumbnailSeek(60)).toBe(2);
  });
});

describe("parseFfprobeOutput", () => {
  it("lee duración, dimensiones y audio", () => {
    const result = parseFfprobeOutput(
      JSON.stringify({
        streams: [
          { codec_type: "video", codec_name: "h264", width: 1920, height: 1080 },
          { codec_type: "audio", codec_name: "aac" },
        ],
        format: { duration: "45.2" },
      }),
    );
    expect(result).toEqual({
      has_video: true,
      has_audio: true,
      duration_s: 45.2,
      width: 1920,
      height: 1080,
      video_codec: "h264",
      is_hdr: false,
    });
  });

  it("intercambia dimensiones en vídeos rotados (iPhone vertical) y detecta HDR", () => {
    const result = parseFfprobeOutput(
      JSON.stringify({
        streams: [
          {
            codec_type: "video",
            codec_name: "hevc",
            width: 3840,
            height: 2160,
            color_transfer: "arib-std-b67",
            side_data_list: [{ rotation: -90 }],
          },
        ],
        format: { duration: "10" },
      }),
    );
    expect(result.width).toBe(2160);
    expect(result.height).toBe(3840);
    expect(result.is_hdr).toBe(true);
    expect(result.has_audio).toBe(false);
  });

  it("marca archivos sin pista de vídeo", () => {
    const result = parseFfprobeOutput(
      JSON.stringify({ streams: [{ codec_type: "audio" }], format: {} }),
    );
    expect(result.has_video).toBe(false);
  });

  it("falla con salida no JSON", () => {
    expect(() => parseFfprobeOutput("nope")).toThrow();
  });
});
