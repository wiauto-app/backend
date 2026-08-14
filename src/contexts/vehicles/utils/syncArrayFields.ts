interface SyncArrayResult {
  toAdd: string[];
  toRemove: string[];
  unchanged: string[];
};

export function syncArrayField(
  existingIds: string[] = [],
  newIds: string[] = [],
): SyncArrayResult {
  const existingSet = new Set(existingIds);
  const newSet = new Set(newIds);

  const toAdd = newIds.filter((id) => !existingSet.has(id));
  const toRemove = existingIds.filter((id) => !newSet.has(id));
  const unchanged = newIds.filter((id) => existingSet.has(id));

  return {
    toAdd,
    toRemove,
    unchanged,
  };
}