import { runProcess } from "./run-process";

export interface FfmpegCapabilities {
  /** `zscale` (zimg): necesario para el tone mapping HDR → SDR correcto. */
  has_zscale: boolean;
  /** Encoder WebP para miniaturas; si falta se usa JPEG. */
  has_libwebp: boolean;
}

let cached: Promise<FfmpegCapabilities> | null = null;

/** Exportado para tests. */
export const parseFfmpegCapabilities = (
  filters_output: string,
  encoders_output: string,
): FfmpegCapabilities => ({
  has_zscale: /\bzscale\b/.test(filters_output),
  has_libwebp: /\blibwebp\b/.test(encoders_output),
});

/**
 * Capacidades del binario `ffmpeg` instalado (builds distintos según entorno:
 * Alpine en producción, Homebrew en local). Se consulta una vez por proceso.
 */
export const getFfmpegCapabilities = (): Promise<FfmpegCapabilities> => {
  cached ??= (async () => {
    const [filters, encoders] = await Promise.all([
      runProcess("ffmpeg", ["-hide_banner", "-filters"], 10_000),
      runProcess("ffmpeg", ["-hide_banner", "-encoders"], 10_000),
    ]);
    return parseFfmpegCapabilities(filters.stdout, encoders.stdout);
  })().catch((error: unknown) => {
    cached = null;
    throw error;
  });
  return cached;
};
