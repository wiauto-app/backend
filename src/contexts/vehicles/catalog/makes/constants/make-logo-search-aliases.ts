/**
 * Consultas de búsqueda preferidas en Wikimedia Commons por nombre de marca.
 * Si no hay alias, se usa `{name} logo`.
 */
export const MAKE_LOGO_SEARCH_ALIASES: Record<string, string> = {
  "Alfa Romeo": "Alfa Romeo logo",
  "Aston Martin": "Aston Martin logo",
  "Land Rover": "Land Rover logo",
  "Mercedes-Benz": "Mercedes-Benz logo",
  "Rolls-Royce": "Rolls-Royce logo",
  BMW: "BMW logo",
  BYD: "BYD Auto logo",
  Cupra: "Cupra logo",
  DS: "DS Automobiles logo",
  Kia: "Kia Motors logo",
  MG: "MG Motor logo",
  Mini: "Mini Cooper logo",
  Opel: "Opel logo",
  Seat: "SEAT logo",
  Skoda: "Škoda logo",
  Volkswagen: "Volkswagen logo",
};

export const resolveMakeLogoSearchQuery = (name: string): string => {
  const trimmed = name.trim();
  return MAKE_LOGO_SEARCH_ALIASES[trimmed] ?? `${trimmed} logo`;
};
