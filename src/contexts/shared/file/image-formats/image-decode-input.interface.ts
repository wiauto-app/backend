export interface ImageDecodeInput {
  buffer: Buffer;
  mimeType?: string;
  /** Clave relativa o compuesta en storage; sirve para inferir extensión. */
  objectKey?: string;
}
