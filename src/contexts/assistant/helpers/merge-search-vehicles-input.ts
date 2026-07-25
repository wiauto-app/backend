import { SearchVehiclesInput } from "../schemas/search-vehicles.schema";

export const mergeSearchVehiclesInput = (
  base: SearchVehiclesInput | undefined,
  patch: SearchVehiclesInput,
): SearchVehiclesInput => {
  const next: SearchVehiclesInput = { ...(base ?? {}) };

  for (const [key, value] of Object.entries(patch) as Array<
    [keyof SearchVehiclesInput, SearchVehiclesInput[keyof SearchVehiclesInput]]
  >) {
    if (value === undefined) {
      continue;
    }
    next[key] = value as never;
  }

  return next;
};
