const NUL_BYTE_PATTERN = /\u0000/g;

/**
 * Recursively strips NUL bytes (`\u0000`) from every string leaf of a
 * value. Postgres rejects `\u0000` inside `text`/`jsonb` columns with
 * `invalid byte sequence for encoding "UTF8": 0x00` (22021), so this must
 * run on any user-provided content before it reaches a TypeORM save.
 */
export const stripNulBytes = <T>(value: T): T => {
  if (typeof value === "string") {
    return value.replace(NUL_BYTE_PATTERN, "") as unknown as T;
  }

  if (Array.isArray(value)) {
    return value.map((item) => stripNulBytes(item)) as unknown as T;
  }

  if (value !== null && typeof value === "object") {
    const sanitizedEntries = Object.entries(
      value as Record<string, unknown>,
    ).map(([key, entryValue]) => [key, stripNulBytes(entryValue)] as const);

    return Object.fromEntries(sanitizedEntries) as T;
  }

  return value;
};
