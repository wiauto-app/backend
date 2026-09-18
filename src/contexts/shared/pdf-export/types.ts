export interface PdfExportConfig {
  timeout?: number;
  format?: 'A4' | 'Letter';
  margin?: { top: number; right: number; bottom: number; left: number };
}

export class PdfTimeoutError extends Error {
  constructor(message: string = 'PDF generation timeout exceeded') {
    super(message);
    this.name = 'PdfTimeoutError';
  }
}

export class PdfRenderError extends Error {
  constructor(message: string = 'PDF rendering failed') {
    super(message);
    this.name = 'PdfRenderError';
  }
}
