import {
  ActiveFiltersApplied,
  ActiveFiltersResolved,
} from "../types/active-filters-response";
import { ActiveFilterItem } from "../types/active-filter-item";
import {
  ListingMetadataParts,
  ListingMetadataResponse,
} from "../types/listing-metadata";
import { TRANSMISSION_TYPE } from "../types/vehicle";

const DEFAULT_SUBJECT = "Coches";
const OCCASION_SUFFIX = "de ocasión";
const SITE_NAME = "WiAuto";
const MAX_TITLE_LENGTH = 60;
const MAX_DESCRIPTION_LENGTH = 160;
const MAX_DESCRIPTION_MODIFIERS = 2;
const MAX_MODEL_NAMES_IN_PAREN = 2;

const formatNumberEs = (value: number): string =>
  new Intl.NumberFormat("es-ES").format(value);

const formatPriceModifier = (
  since?: number,
  until?: number,
): string | null => {
  if (since != null && until != null) {
    return `${formatNumberEs(since)}–${formatNumberEs(until)} €`;
  }
  if (since != null) {
    return `desde ${formatNumberEs(since)} €`;
  }
  if (until != null) {
    return `hasta ${formatNumberEs(until)} €`;
  }
  return null;
};

const formatYearModifier = (
  since?: number,
  until?: number,
): string | null => {
  if (since != null && until != null) {
    if (since === until) {
      return String(since);
    }
    return `${since}–${until}`;
  }
  if (since != null) {
    return `desde ${since}`;
  }
  if (until != null) {
    return `hasta ${until}`;
  }
  return null;
};

const formatMileageModifier = (
  since?: number,
  until?: number,
): string | null => {
  if (since != null && until != null) {
    return `${formatNumberEs(since)}–${formatNumberEs(until)} km`;
  }
  if (since != null) {
    return `desde ${formatNumberEs(since)} km`;
  }
  if (until != null) {
    return `hasta ${formatNumberEs(until)} km`;
  }
  return null;
};

const formatTransmissionModifier = (
  transmission_types?: string[],
): string | null => {
  if (!transmission_types || transmission_types.length === 0) {
    return null;
  }
  if (transmission_types.length > 1) {
    return "varios cambios";
  }
  const [first] = transmission_types;
  if (first === TRANSMISSION_TYPE.MANUAL) {
    return "manual";
  }
  if (first === TRANSMISSION_TYPE.AUTOMATIC) {
    return "automático";
  }
  return first;
};

const formatFuelModifier = (fuels: ActiveFilterItem[]): string | null => {
  if (fuels.length === 0) {
    return null;
  }
  if (fuels.length === 1) {
    return fuels[0].name;
  }
  if (fuels.length === 2) {
    return `${fuels[0].name} y ${fuels[1].name}`;
  }
  return "varios combustibles";
};

const buildBrandModel = (
  makes: ActiveFilterItem[],
  models: ActiveFilterItem[],
): string | null => {
  if (makes.length === 0) {
    return null;
  }

  if (makes.length > 2) {
    return "de varias marcas";
  }

  if (makes.length === 2) {
    return `${makes[0].name} y ${makes[1].name}`;
  }

  const make = makes[0];
  const make_models = models.filter(
    (model) => model.make_id == null || model.make_id === make.id,
  );

  if (make_models.length === 0) {
    return make.name;
  }

  if (make_models.length === 1) {
    return `${make.name} ${make_models[0].name}`;
  }

  const visible = make_models
    .slice(0, MAX_MODEL_NAMES_IN_PAREN)
    .map((model) => model.name);
  const has_more = make_models.length > MAX_MODEL_NAMES_IN_PAREN;
  const models_label = has_more
    ? `${visible.join(", ")} y más`
    : visible.join(", ");

  return `${make.name} (${models_label})`;
};

const buildLocation = (
  municipalities: ActiveFilterItem[],
  provinces: ActiveFilterItem[],
  communities: ActiveFilterItem[],
): string | null => {
  if (municipalities.length > 0) {
    if (municipalities.length > 1) {
      return "en varias ubicaciones";
    }
    return `en ${municipalities[0].name}`;
  }

  if (provinces.length > 0) {
    if (provinces.length > 1) {
      return "en varias ubicaciones";
    }
    return `en ${provinces[0].name}`;
  }

  if (communities.length > 0) {
    if (communities.length > 1) {
      return "en varias ubicaciones";
    }
    return `en ${communities[0].name}`;
  }

  return null;
};

const buildModifiers = (
  resolved: ActiveFiltersResolved,
  applied: ActiveFiltersApplied,
): string[] => {
  const modifiers: string[] = [];

  const price = formatPriceModifier(applied.since_price, applied.until_price);
  if (price) {
    modifiers.push(price);
  }

  const year = formatYearModifier(applied.since_year, applied.until_year);
  if (year) {
    modifiers.push(year);
  }

  const mileage = formatMileageModifier(
    applied.since_mileage,
    applied.until_mileage,
  );
  if (mileage) {
    modifiers.push(mileage);
  }

  const fuel = formatFuelModifier(resolved.fuels);
  if (fuel) {
    modifiers.push(fuel);
  }

  const transmission = formatTransmissionModifier(applied.transmission_types);
  if (transmission) {
    modifiers.push(transmission);
  }

  if (applied.price_offer === true) {
    modifiers.push("en oferta");
  }

  return modifiers;
};

const buildH1 = (
  subject: string,
  brand_model: string | null,
  location: string | null,
): string => {
  const lead_parts: string[] = [];

  const omit_default_subject =
    subject === DEFAULT_SUBJECT &&
    brand_model != null &&
    brand_model !== "de varias marcas";

  if (!omit_default_subject) {
    lead_parts.push(subject);
  }

  if (brand_model) {
    lead_parts.push(brand_model);
  }

  const lead = lead_parts.join(" ").trim();
  const with_occasion = `${lead} ${OCCASION_SUFFIX}`.trim();

  if (!location) {
    return with_occasion;
  }

  return `${with_occasion} ${location}`.trim();
};

const truncateAtWord = (value: string, max_length: number): string => {
  if (value.length <= max_length) {
    return value;
  }

  const sliced = value.slice(0, max_length - 1);
  const last_space = sliced.lastIndexOf(" ");
  const base = last_space > 20 ? sliced.slice(0, last_space) : sliced;
  return `${base.trimEnd()}…`;
};

const buildDocumentTitle = (h1: string): string => {
  const suffix = ` | ${SITE_NAME}`;
  const max_h1_length = MAX_TITLE_LENGTH - suffix.length;

  if (h1.length <= max_h1_length) {
    return `${h1}${suffix}`;
  }

  return `${truncateAtWord(h1, max_h1_length)}${suffix}`;
};

const buildDescription = (h1: string, modifiers: string[]): string => {
  const short_modifiers = modifiers.slice(0, MAX_DESCRIPTION_MODIFIERS);
  const raw =
    short_modifiers.length === 0
      ? h1
      : `${h1} · ${short_modifiers.join(" · ")}`;

  return truncateAtWord(raw, MAX_DESCRIPTION_LENGTH);
};

export const buildListingMetadata = (
  resolved: ActiveFiltersResolved,
  applied: ActiveFiltersApplied,
): ListingMetadataResponse => {
  const type_name = resolved.vehicle_type?.name.trim();
  const subject =
    type_name != null && type_name.length > 0 ? type_name : DEFAULT_SUBJECT;
  const brand_model = buildBrandModel(resolved.makes, resolved.models);
  const location = buildLocation(
    resolved.municipalities,
    resolved.provinces,
    resolved.communities,
  );
  const modifiers = buildModifiers(resolved, applied);
  const h1 = buildH1(subject, brand_model, location);

  const parts: ListingMetadataParts = {
    subject,
    brand_model,
    location,
    modifiers,
  };

  return {
    h1,
    title: buildDocumentTitle(h1),
    description: buildDescription(h1, modifiers),
    parts,
  };
};
