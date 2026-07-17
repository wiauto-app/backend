import path from "node:path";

/**
 * Tras el procesado, el vídeo vive bajo el mismo "directorio" lógico y nombre de fichero, con extensión `.mp4`.
 */
export function file_key_to_mp4_storage_key(file_key: string): string {
  const normalized = file_key.replaceAll("\\", "/");
  const parsed = path.posix.parse(normalized);
  if (parsed.ext.toLowerCase() === ".mp4") {
    return normalized;
  }
  if (!parsed.name) {
    return `${normalized}.mp4`;
  }
  return path.posix.join(parsed.dir, `${parsed.name}.mp4`);
}
