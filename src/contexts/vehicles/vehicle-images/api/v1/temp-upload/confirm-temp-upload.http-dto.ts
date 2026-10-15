export interface ConfirmTempUploadResponseDto {
  success: boolean;
  upload_id: string;
  /** URL GET firmada para previsualizar la imagen (caduca junto al upload). */
  preview_url: string;
  /** ISO: el upload confirmado se conserva 24h para poder reclamarlo. */
  expires_at: string;
}
