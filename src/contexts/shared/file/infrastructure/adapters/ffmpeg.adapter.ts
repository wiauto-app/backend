import { execFile } from "node:child_process";
import { promisify } from "node:util";

import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { VideoProcessorPort } from "../../domain/ports/video-processor.port";

const exec_file = promisify(execFile);

/**
 * Salida local unificada en MP4: da igual si el origen es `.mov`, `.m4v` (iPhone),
 * u otro; el fichero listo es siempre `*_processed.mp4`.
 */
export function local_processed_video_path(input_path: string): string {
  const last_dot = input_path.lastIndexOf(".");
  const base = last_dot === -1 ? input_path : input_path.slice(0, last_dot);
  return `${base}_processed.mp4`;
}

@Injectable()
export class FfmpegAdapter extends VideoProcessorPort {
  /**
   * Entradas: lo que demuxee ffmpeg (mov/m4v de iPhone, HEVC, avi, mkv, webm, etc.).
   * Salida: MP4, H.264, AAC si hay audio, yuv420p, faststart.
   */
  async processVideo(file_path: string): Promise<string> {
    try {
      const output_path = local_processed_video_path(file_path);
      await exec_file("ffmpeg", [
        "-y",
        "-loglevel",
        "error",
        "-i",
        file_path,
        "-map",
        "0:v:0",
        "-map",
        "0:a?",
        "-c:v",
        "libx264",
        "-crf",
        "23",
        "-preset",
        "fast",
        "-pix_fmt",
        "yuv420p",
        "-c:a",
        "aac",
        "-b:a",
        "128k",
        "-movflags",
        "+faststart",
        "-f",
        "mp4",
        output_path,
      ]);
      return output_path;
    } catch (error) {
      throw new Error(`Error processing video: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
