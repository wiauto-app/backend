export const normalizeUserAgent = (header: string | undefined): string | null =>
  header?.trim() ? header.trim() : null;
