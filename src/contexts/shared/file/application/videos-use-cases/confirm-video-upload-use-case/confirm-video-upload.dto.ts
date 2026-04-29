export class ConfirmVideoUploadDto {
  file_key: string;
}

/** Respuesta: `file_key` es el de la subida; `file_key_en_storage` es la clave final (p. ej. `.mp4` tras el job). */
export type ConfirmVideoUploadResult = {
  file_key: string;
  file_key_en_storage: string;
};