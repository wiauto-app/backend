const stableStringifyValue = (value: unknown): string => {
  if (value === null) {
    return "null";
  }

  const value_type = typeof value;

  if (value_type === "undefined") {
    return "undefined";
  }

  if (value_type !== "object") {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringifyValue(item)).join(",")}]`;
  }

  const record = value as Record<string, unknown>;
  const keys = Object.keys(record).sort();

  return `{${keys
    .map(
      (key) =>
        `${JSON.stringify(key)}:${stableStringifyValue(record[key])}`,
    )
    .join(",")}}`;
};

/** Serializa un objeto con claves ordenadas para claves de caché deterministas. */
export const stableStringify = (value: unknown): string =>
  stableStringifyValue(value);
