/**
 * Carga serializable para Redis/Bull (los Buffer de Multer no sobreviven al JSON).
 */
export interface QueuedFilePayload {
  originalname: string;
  mimetype: string;
  contentBase64: string;
}

export interface UploadJob {
  files: QueuedFilePayload[];
  path: string;
  entity: "vehicle" | "profile";
  entityId: string;
}

export abstract class FileQueuePort {
  abstract enqueue(uploadJob: UploadJob): Promise<void>;
}
