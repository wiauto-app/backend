export const formatCurrencyEur = (amount: number): string => {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatMileage = (mileage: number): string => {
  const formatted = new Intl.NumberFormat("es-ES").format(mileage);
  return `${formatted} km`;
};

export const humanizeSlug = (slug: string): string => {
  return slug
    .split("-")
    .filter((part) => part.length > 0)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

export const formatTransmissionLabel = (transmission_type: string): string => {
  if (transmission_type === "automatic") {
    return "Automática";
  }
  if (transmission_type === "manual") {
    return "Manual";
  }
  return humanizeSlug(transmission_type);
};

export const formatLocationLabel = (
  municipality_slugs: string[],
  province_slugs: string[],
): string => {
  const municipality = municipality_slugs[0]
    ? humanizeSlug(municipality_slugs[0])
    : null;
  const province = province_slugs[0] ? humanizeSlug(province_slugs[0]) : null;

  if (municipality && province) {
    return `${municipality}, ${province}`;
  }
  if (municipality) {
    return municipality;
  }
  if (province) {
    return province;
  }
  return "Ubicación no disponible";
};
