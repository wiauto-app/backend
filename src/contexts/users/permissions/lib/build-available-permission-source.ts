/** Construye el texto TS para `available-permission.ts` a partir de las `key` de BD. */

export type permission_row_for_codegen = {
  key: string;
};

const permission_db_key_to_identifier = (db_key: string): string => {
  const normalized = db_key
    .trim()
    .split(/[.\s\-/]+/)
    .filter(Boolean)
    .map((segment) => segment.replace(/[^a-zA-Z0-9]/g, "").toUpperCase())
    .join("_");
  const base = normalized || "PERMISSION";
  return /^[0-9]/.test(base) ? `_${base}` : base;
};

export const build_available_permission_file_content = (
  rows: permission_row_for_codegen[],
): string => {
  const sorted = [...rows].sort((a, b) => a.key.localeCompare(b.key));
  const used_identifiers = new Set<string>();
  const seen_db_keys = new Set<string>();
  const pairs: { identifier: string; db_key: string }[] = [];

  for (const row of sorted) {
    const db_key = row.key?.trim();
    if (!db_key) continue;
    if (seen_db_keys.has(db_key)) continue;
    seen_db_keys.add(db_key);

    let base = permission_db_key_to_identifier(db_key);
    let candidate = base;
    let suffix = 1;
    while (used_identifiers.has(candidate)) {
      suffix += 1;
      candidate = `${base}_${suffix}`;
    }
    used_identifiers.add(candidate);
    pairs.push({ identifier: candidate, db_key });
  }

  const header = `/**
 * Archivo generado automáticamente — no editar a mano.
 * Regenerar: PermissionService.sync_available_permission_keys_file()
 * o POST /v1/permissions/sync-available-keys-file (JWT).
 *
 * Uso en endpoints: JwtGuard + PermissionGuard + @RequirePermissions(PermissionKeys.XXX).
 * Generado: ${new Date().toISOString()}
 */

`;

  if (pairs.length === 0) {
    return `${header}export const PermissionKeys = {} as const;

export type PermissionKey = never;
`;
  }

  const body = pairs
    .map((p) => `  ${p.identifier}: ${JSON.stringify(p.db_key)},`)
    .join("\n");

  return `${header}export const PermissionKeys = {
${body}
} as const;

export type PermissionKey =
  (typeof PermissionKeys)[keyof typeof PermissionKeys];
`;
};
