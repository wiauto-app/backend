import type { RecommendVehiclePriceSource } from "../../dto/recommend-vehicle-price.dto";
import type { VehicleMarketConfidence } from "../../services/vehicle-market-stats.service";
import type { TransmissionType } from "../../types/vehicle";
import type { AppraisalOfferStatus } from "./appraisal-offer";
import type { AppraisalRequestStatus } from "./appraisal-request";

export interface AppraisalVehicleSummary {
  /** Ids del catálogo, para prellenar el formulario de publicación. */
  make_id: number;
  model_id: number;
  year_id: number;
  version_id: number | null;
  fuel_type_id: number | null;
  make_name: string;
  model_name: string;
  year: number;
  version_name: string | null;
  fuel_type_name: string | null;
  transmission_type: TransmissionType;
  mileage: number;
  power: number | null;
  vehicle_label: string;
}

export interface AppraisalEstimate {
  recommended_price: number;
  range_min: number;
  range_max: number;
  explanation: string | null;
  confidence: VehicleMarketConfidence | null;
  source: RecommendVehiclePriceSource | null;
}

export interface AppraisalOfferDealership {
  id: string;
  name: string;
  slug: string;
  avatar_url: string | null;
}

export interface AppraisalOfferView {
  id: string;
  amount: number;
  message: string | null;
  status: AppraisalOfferStatus;
  created_at: Date;
  updated_at: Date;
  dealership: AppraisalOfferDealership;
}

export interface AppraisalContact {
  name: string;
  email: string;
  phone_code: string;
  phone: string;
}

/** Tasación vista por su dueño. */
export interface AppraisalDetail {
  id: string;
  status: AppraisalRequestStatus;
  created_at: Date;
  offers_requested_at: Date | null;
  offers_expire_at: Date | null;
  accepted_offer_id: string | null;
  vehicle: AppraisalVehicleSummary;
  estimate: AppraisalEstimate | null;
  contact: AppraisalContact;
  offers: AppraisalOfferView[];
}

export interface AppraisalListItem {
  id: string;
  status: AppraisalRequestStatus;
  created_at: Date;
  offers_expire_at: Date | null;
  vehicle: AppraisalVehicleSummary;
  estimate: AppraisalEstimate | null;
  offers_count: number;
  best_offer_amount: number | null;
}

export interface AppraisalMyOffer {
  id: string;
  amount: number;
  message: string | null;
  status: AppraisalOfferStatus;
  updated_at: Date;
}

/**
 * Tasación vista por un concesionario. Sin datos del vendedor salvo que su oferta
 * haya sido aceptada.
 */
export interface AppraisalOpportunity {
  id: string;
  status: AppraisalRequestStatus;
  created_at: Date;
  offers_expire_at: Date | null;
  vehicle: AppraisalVehicleSummary;
  estimate: AppraisalEstimate | null;
  offers_count: number;
  my_offer: AppraisalMyOffer | null;
  seller_contact: AppraisalContact | null;
}
