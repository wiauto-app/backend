export const CONTENT_TYPES = {
  IMAGE_JPEG: "image/jpeg",
  IMAGE_JPG: "image/jpg",
  IMAGE_PNG: "image/png",
  IMAGE_WEBP: "image/webp",
  VIDEO_MP4: "video/mp4",
  VIDEO_MOV: "video/mov",
  VIDEO_AVI: "video/avi",
  VIDEO_MKV: "video/mkv",
  VIDEO_WEBM: "video/webm",
  AUDIO_MP3: "audio/mp3",
  AUDIO_M4A: "audio/m4a",
} as const;
export type ContentType = (typeof CONTENT_TYPES)[keyof typeof CONTENT_TYPES];

export abstract class FileStoragePort {
  abstract uploadFiles(files: Express.Multer.File[], storagePath: string): Promise<string[]>;
  abstract deleteFiles(urls: string[]): Promise<void>;
  abstract downloadFile(fileKey: string): Promise<Buffer | null>;
  /** Clave S3/MinIO en el bucket de vídeos. */
  abstract downloadVideoFile(file_key: string): Promise<Buffer | null>;
  /** Sube o reemplaza el objeto en el bucket de vídeos bajo `file_key`. */
  abstract replaceVideoObject(
    file_key: string,
    body: Buffer,
    content_type: ContentType,
  ): Promise<void>;
  /** Borra un objeto en el bucket de vídeos (p. ej. clave antigua al pasar a `.mp4`). */
  abstract deleteVideoObject(file_key: string): Promise<void>;
  abstract generateSignedUrl(bucketName: string, fileKey: string, contentType: ContentType): Promise<string>;
}