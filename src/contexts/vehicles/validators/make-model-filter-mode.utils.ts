export type MakeModelFilterMode = "and" | "or";

/**
 * Si hay marcas y modelos seleccionados, decide si combinarlos con AND o OR.
 *
 * AND: al menos un modelo del catálogo pertenece a una marca seleccionada (p. ej. toyota + corolla).
 * OR: ningún modelo resuelto coincide con las marcas elegidas (p. ej. abarth + corolla).
 */
export const resolveMakeModelFilterMode = (
  selected_makes_slugs: string[],
  model_make_slugs: string[],
): MakeModelFilterMode => {
  const model_makes = [...new Set(model_make_slugs)];
  const has_valid_combination = selected_makes_slugs.some((make_slug) =>
    model_makes.includes(make_slug),
  );
  return has_valid_combination ? "and" : "or";
};
