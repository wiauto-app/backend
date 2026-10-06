import type { SearchVehiclesInput } from "../schemas/search-vehicles.schema";

/** Minúsculas y sin tildes, para comparar frases del usuario. */
const normalize = (text: string): string =>
  text.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "");

// "25000", "25.000", "25 000", "25,5", seguido opcionalmente de "k"/"mil" y de "€"/"euros".
const AMOUNT = String.raw`(\d{1,3}(?:[.\s]\d{3})+|\d+(?:[.,]\d+)?)\s*(?:(k|mil)(?![a-z]))?\s*(€|eur(?:os?)?)?`;
// Si el número va seguido de una de estas unidades no es un precio.
const NON_PRICE_UNIT = /^\s*(km|kms|kilometros?|cv|caballos?|kw|cc|plazas|puertas|anos?|meses)\b/;

const UNTIL_WORDS = String.raw`menos de|hasta|maximo(?: de)?|max\.?|como mucho|no mas de|por debajo de|tope de|inferior a|que no pase de`;
const SINCE_WORDS = String.raw`mas de|desde|minimo(?: de)?|a partir de|por encima de|superior a`;
const BUDGET_WORDS = String.raw`tengo|presupuesto(?: maximo)?(?: de)?|dispongo de|cuento con|puedo gastar|gastarme|con`;

interface AmountMatch {
  raw: string | undefined;
  multiplier: string | undefined;
  currency: string | undefined;
  /** Texto que sigue al número, para descartar unidades (km, CV…). */
  after: string;
}

const toAmount = ({ raw, multiplier, currency, after }: AmountMatch): number | undefined => {
  if (!raw) {
    return undefined;
  }
  if (!currency && !multiplier && NON_PRICE_UNIT.test(after)) {
    return undefined;
  }

  const isThousandsGrouped = /^\d{1,3}([.\s]\d{3})+$/.test(raw);
  const base = isThousandsGrouped
    ? Number(raw.replace(/[.\s]/g, ""))
    : Number(raw.replace(",", "."));
  if (!Number.isFinite(base)) {
    return undefined;
  }

  const value = multiplier ? base * 1000 : base;
  const hasPriceMarker = Boolean(currency ?? multiplier);
  // Sin "€"/"mil"/"k", un número de 4 cifras entre 1900 y 2035 es un año, y uno bajo no es un precio.
  const looksLikeYear = value >= 1900 && value <= 2035 && !isThousandsGrouped;
  if (!hasPriceMarker && (value < 1000 || looksLikeYear)) {
    return undefined;
  }

  return Math.round(value);
};

const amountAfter = (pattern: RegExp, text: string): number | undefined => {
  const match = pattern.exec(text);
  if (!match) {
    return undefined;
  }
  return toAmount({
    raw: match[1],
    multiplier: match[2],
    currency: match[3],
    after: text.slice(match.index + match[0].length),
  });
};

/**
 * Precio explícito del mensaje, de forma determinista (no depende del LLM):
 * "entre 10.000 y 15.000", "menos de 25000 euros", "desde 8 mil",
 * "tengo 10000 para gastar" (presupuesto = tope, nunca precio exacto).
 */
export const parsePriceFromMessage = (
  message: string,
): Pick<SearchVehiclesInput, "since_price" | "until_price"> => {
  const text = normalize(message);

  const between = new RegExp(String.raw`\bentre\s+${AMOUNT}\s+y\s+${AMOUNT}`).exec(text);
  if (between) {
    const after = text.slice(between.index + between[0].length);
    const low = toAmount({ raw: between[1], multiplier: between[2] ?? between[5], currency: between[3] ?? between[6], after });
    const high = toAmount({ raw: between[4], multiplier: between[5], currency: between[6], after });
    if (low !== undefined && high !== undefined) {
      return { since_price: Math.min(low, high), until_price: Math.max(low, high) };
    }
  }

  const until = amountAfter(new RegExp(String.raw`\b(?:${UNTIL_WORDS})\s+${AMOUNT}`), text);
  const since = amountAfter(new RegExp(String.raw`\b(?:${SINCE_WORDS})\s+${AMOUNT}`), text);
  const budget = amountAfter(new RegExp(String.raw`\b(?:${BUDGET_WORDS})\s+${AMOUNT}`), text);

  const result: Pick<SearchVehiclesInput, "since_price" | "until_price"> = {};
  if (since !== undefined) {
    result.since_price = since;
  }
  const ceiling = until ?? budget;
  if (ceiling !== undefined) {
    result.until_price = ceiling;
  }
  return result;
};

const RESET_PATTERN =
  /\b(olvida|olvidate|olvidemos|empecemos de nuevo|empezar de cero|desde cero|nueva busqueda|otra busqueda distinta|borra (?:los )?filtros|quita (?:todos )?los filtros|resetea|reinicia)\b/;

/** "Olvida lo anterior", "nueva búsqueda"…: no se arrastran los filtros previos. */
export const isSearchResetRequest = (message: string): boolean =>
  RESET_PATTERN.test(normalize(message));

const CHEAPER_PATTERN = /\b(mas barat[oa]s?|mas economic[oa]s?|por menos dinero|menos caro)\b/;

/** "Algo más barato": el tope pasa a ser el precio más bajo de la búsqueda anterior. */
export const isCheaperRequest = (message: string): boolean =>
  CHEAPER_PATTERN.test(normalize(message));
