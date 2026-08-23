export class ImageDto {
  id?: string;
  /** Flujo async: temporary_uploads.id confirmado. */
  upload_id?: string;
  /** Path compuesto (temp o definitivo). Obligatorio si no hay upload_id. */
  path?: string;
  order: number;
}
