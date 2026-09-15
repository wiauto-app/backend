export class ConfirmVideoUploadDto {
  file_key: string;
}

/** Respuesta: la clave en storage es la misma del PUT (sin transcode). */
export interface ConfirmVideoUploadResult {
  file_key: string;
  file_key_en_storage: string;
}
