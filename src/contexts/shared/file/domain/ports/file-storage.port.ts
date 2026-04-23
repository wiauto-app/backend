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
} as const;
export type ContentType = (typeof CONTENT_TYPES)[keyof typeof CONTENT_TYPES];

export abstract class FileStoragePort {
  abstract uploadFiles(files: Express.Multer.File[], storagePath: string): Promise<string[]>;
  abstract deleteFiles(urls: string[]): Promise<void>;
  abstract generateSignedUrl(bucketName: string, fileKey: string, contentType: ContentType): Promise<string>;
}