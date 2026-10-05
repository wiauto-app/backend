import { AppraisalOfferEntity } from "../entities/appraisal-offer.entity";
import { AppraisalRequestEntity } from "../entities/appraisal-request.entity";
import { APPRAISAL_OFFER_STATUS } from "../types/appraisal-offer";
import type {
  AppraisalContact,
  AppraisalEstimate,
  AppraisalOfferView,
  AppraisalVehicleSummary,
} from "../types/appraisal";

/** Relaciones necesarias para armar las vistas de una tasación. */
export const APPRAISAL_VIEW_RELATIONS = [
  "make",
  "model",
  "year",
  "version",
  "version.fuel_type",
];

const toNumberOrNull = (value: string | number | null): number | null =>
  value === null ? null : Number(value);

export const toAppraisalVehicle = (
  row: AppraisalRequestEntity,
): AppraisalVehicleSummary => ({
  make_id: row.make_id,
  model_id: row.model_id,
  year_id: row.year_id,
  version_id: row.version_id,
  fuel_type_id: row.fuel_type_id,
  make_name: row.make.name,
  model_name: row.model.name,
  year: row.year.year,
  version_name: row.version?.name ?? null,
  fuel_type_name: row.version?.fuel_type.name ?? null,
  transmission_type: row.transmission_type,
  mileage: row.mileage,
  power: row.power,
  vehicle_label: `${row.make.name} ${row.model.name} (${row.year.year})`,
});

export const toAppraisalEstimate = (
  row: AppraisalRequestEntity,
): AppraisalEstimate | null => {
  const range_min = toNumberOrNull(row.estimated_price_min);
  const range_max = toNumberOrNull(row.estimated_price_max);
  if (range_min === null || range_max === null) {
    return null;
  }

  return {
    recommended_price:
      toNumberOrNull(row.recommended_price) ??
      Math.round((range_min + range_max) / 2),
    range_min,
    range_max,
    explanation: row.ai_explanation ?? row.admin_note,
    confidence: row.ai_confidence,
    source: row.ai_source,
  };
};

export const toAppraisalContact = (
  row: AppraisalRequestEntity,
): AppraisalContact => ({
  name: row.name,
  email: row.email,
  phone_code: row.phone_code,
  phone: row.phone,
});

export const toAppraisalOfferView = (
  offer: AppraisalOfferEntity,
): AppraisalOfferView => ({
  id: offer.id,
  amount: Number(offer.amount),
  message: offer.message,
  status: offer.status,
  created_at: offer.created_at,
  updated_at: offer.updated_at,
  dealership: {
    id: offer.dealership.id,
    name: offer.dealership.name,
    slug: offer.dealership.slug,
    avatar_url: offer.dealership.avatar_url ?? null,
  },
});

/** Ofertas que cuentan para el vendedor: pendientes o la aceptada. */
export const isLiveOffer = (offer: AppraisalOfferEntity): boolean =>
  offer.status === APPRAISAL_OFFER_STATUS.PENDING ||
  offer.status === APPRAISAL_OFFER_STATUS.ACCEPTED;

/** Texto recortado, o `null` si queda vacío. */
export const trimToNull = (value: string | null | undefined): string | null => {
  const trimmed = value?.trim();
  if (!trimmed) {
    return null;
  }
  return trimmed;
};

export const formatEur = (amount: number): string =>
  new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(amount);
