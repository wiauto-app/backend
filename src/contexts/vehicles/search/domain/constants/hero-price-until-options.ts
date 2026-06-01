export const HERO_PRICE_UNTIL_OPTIONS = [
  5000, 10000, 15000, 20000, 30000, 50000,
] as const;

export type HeroPriceUntilOption = (typeof HERO_PRICE_UNTIL_OPTIONS)[number];

export const formatHeroPriceUntilLabel = (until_price: number): string =>
  `Hasta ${until_price.toLocaleString("es-ES")} €`;
