import { VEHICLE_VIDEO_MAX_LONG_SIDE } from "../media.constants";

/**
 * Escala por lado largo sin agrandar; vale para horizontales y verticales.
 * ffmpeg aplica la rotación de metadatos antes de los filtros (autorotate),
 * así que `iw`/`ih` ya son las dimensiones de visualización. Dimensiones pares
 * (requisito de yuv420p).
 */
export const buildScaleFilter = (
  max_long_side = VEHICLE_VIDEO_MAX_LONG_SIDE,
): string =>
  `scale=w='if(gte(iw,ih),trunc(min(${max_long_side},iw)/2)*2,-2)':h='if(gte(iw,ih),-2,trunc(min(${max_long_side},ih)/2)*2)'`;

/** Tone mapping HDR (PQ/HLG) → SDR BT.709. Requiere ffmpeg con zimg (`zscale`). */
export const HDR_TO_SDR_FILTER =
  "zscale=t=linear:npl=100,format=gbrpf32le,zscale=p=bt709,tonemap=tonemap=hable:desat=0,zscale=t=bt709:m=bt709:r=tv,format=yuv420p";

export interface TranscodeArgsInput {
  input: string;
  output: string;
  is_hdr: boolean;
  /** ffmpeg con `zscale`; sin él un HDR se convierte sin tone mapping. */
  can_tonemap?: boolean;
}

/** MP4 H.264/AAC con faststart, listo para reproducción progresiva vía CDN. */
export const buildTranscodeArgs = ({
  input,
  output,
  is_hdr,
  can_tonemap = true,
}: TranscodeArgsInput): string[] => {
  const filters = [buildScaleFilter()];
  if (is_hdr && can_tonemap) {
    filters.push(HDR_TO_SDR_FILTER);
  }

  return [
    "-hide_banner",
    "-y",
    "-i",
    input,
    "-map",
    "0:v:0",
    "-map",
    "0:a:0?",
    "-vf",
    filters.join(","),
    "-c:v",
    "libx264",
    "-preset",
    "medium",
    "-crf",
    "23",
    "-pix_fmt",
    "yuv420p",
    "-color_primaries",
    "bt709",
    "-color_trc",
    "bt709",
    "-colorspace",
    "bt709",
    "-c:a",
    "aac",
    "-b:a",
    "128k",
    "-ac",
    "2",
    "-movflags",
    "+faststart",
    "-map_metadata",
    "-1",
    output,
  ];
};

export type ThumbnailFormat = "webp" | "jpeg";

export interface ThumbnailArgsInput {
  input: string;
  output: string;
  duration_s: number | null;
  is_hdr: boolean;
  can_tonemap?: boolean;
  /** WebP si ffmpeg trae `libwebp`; si no, JPEG. */
  format?: ThumbnailFormat;
}

/** Segundo del que se extrae la miniatura: 2 s o la mitad si el vídeo es más corto. */
export const resolveThumbnailSeek = (duration_s: number | null): number => {
  if (!duration_s || duration_s <= 0) {
    return 0;
  }
  return Math.min(2, duration_s / 2);
};

export const buildThumbnailArgs = ({
  input,
  output,
  duration_s,
  is_hdr,
  can_tonemap = true,
  format = "webp",
}: ThumbnailArgsInput): string[] => {
  const filters = is_hdr && can_tonemap ? [HDR_TO_SDR_FILTER] : [];
  filters.push("scale=640:-2");
  const codec =
    format === "webp"
      ? ["-c:v", "libwebp", "-quality", "80"]
      : ["-c:v", "mjpeg", "-q:v", "3"];

  return [
    "-hide_banner",
    "-y",
    "-ss",
    resolveThumbnailSeek(duration_s).toFixed(2),
    "-i",
    input,
    "-frames:v",
    "1",
    "-vf",
    filters.join(","),
    ...codec,
    output,
  ];
};
