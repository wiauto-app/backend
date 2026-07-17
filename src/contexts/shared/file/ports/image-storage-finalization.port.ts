/**
 * Finaliza rutas de imagen en storage: promueve temp, convierte a WebP y optimiza peso.
 */
export abstract class ImageStorageFinalizationPort {
  /**
   * @param compound_path Ruta compuesta `bucket/clave` o pathname `/bucket/clave`
   * @returns Pathname definitivo (`/bucket/clave.webp`) listo para persistir
   */
  abstract finalize_compound_path(compound_path: string): Promise<string>;
}
