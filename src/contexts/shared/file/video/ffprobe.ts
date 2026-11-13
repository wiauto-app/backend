import { runProcess } from "./run-process";

export interface VideoProbeResult {
  has_video: boolean;
  has_audio: boolean;
  duration_s: number | null;
  /** Dimensiones de visualización (ya aplicada la rotación). */
  width: number | null;
  height: number | null;
  video_codec: string | null;
  is_hdr: boolean;
}

interface FfprobeStream {
  codec_type?: string;
  codec_name?: string;
  width?: number;
  height?: number;
  duration?: string;
  color_transfer?: string;
  tags?: Record<string, string>;
  side_data_list?: { rotation?: number | string }[];
}

interface FfprobeOutput {
  streams?: FfprobeStream[];
  format?: { duration?: string };
}

const HDR_TRANSFERS = new Set(["smpte2084", "arib-std-b67"]);

const toNumber = (value: unknown): number | null => {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const resolveRotation = (stream: FfprobeStream): number => {
  const fromSideData = stream.side_data_list
    ?.map((item) => toNumber(item.rotation))
    .find((value): value is number => value !== null);
  const rotation = fromSideData ?? toNumber(stream.tags?.rotate) ?? 0;
  return ((Math.round(rotation) % 360) + 360) % 360;
};

/** Interpreta la salida JSON de ffprobe (función pura, testeable). */
export const parseFfprobeOutput = (raw: string): VideoProbeResult => {
  let parsed: FfprobeOutput;
  try {
    parsed = JSON.parse(raw) as FfprobeOutput;
  } catch {
    throw new Error("ffprobe devolvió una salida no válida");
  }

  const streams = parsed.streams ?? [];
  const video = streams.find((stream) => stream.codec_type === "video");
  const has_audio = streams.some((stream) => stream.codec_type === "audio");

  if (!video) {
    return {
      has_video: false,
      has_audio,
      duration_s: null,
      width: null,
      height: null,
      video_codec: null,
      is_hdr: false,
    };
  }

  const rotation = resolveRotation(video);
  const swap = rotation === 90 || rotation === 270;
  const width = toNumber(video.width);
  const height = toNumber(video.height);

  return {
    has_video: true,
    has_audio,
    duration_s:
      toNumber(parsed.format?.duration) ?? toNumber(video.duration) ?? null,
    width: swap ? height : width,
    height: swap ? width : height,
    video_codec: video.codec_name ?? null,
    is_hdr: HDR_TRANSFERS.has(video.color_transfer ?? ""),
  };
};

/**
 * Analiza un fichero local o una URL HTTP(S) (ffprobe usa peticiones Range,
 * no descarga el vídeo completo).
 */
export const probeVideo = async (
  input: string,
  timeout_ms = 20_000,
): Promise<VideoProbeResult> => {
  const { stdout } = await runProcess(
    "ffprobe",
    [
      "-v",
      "error",
      "-print_format",
      "json",
      "-show_format",
      "-show_streams",
      input,
    ],
    timeout_ms,
  );
  return parseFfprobeOutput(stdout);
};
