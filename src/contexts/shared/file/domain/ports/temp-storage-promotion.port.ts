/**
 * Promueve objetos subidos a rutas temporales hacia su ubicación definitiva en el bucket.
 * Convención: la ruta incluye el segmento `temp` (p. ej. `vehicles-images/temp/gallery/x.jpg`).
 * La implementación también optimiza la imagen (WebP, resize, compresión).
 */
export abstract class TempStoragePromotionPort {
  /**
   * Copia el objeto a la ruta sin `temp` y elimina el original.
   * @returns Pathname definitivo (`/bucket/clave`) listo para persistir.
   */
  abstract promote_compound_path(compound_path: string): Promise<string>;
}
