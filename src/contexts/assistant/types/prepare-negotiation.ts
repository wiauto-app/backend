export interface NegotiationOfferRange {
  min: number;
  max: number;
  currency: "EUR";
}

export interface PrepareNegotiationResult {
  vehicle_id: string;
  ref: string | null;
  talking_points: string[];
  offer_range?: NegotiationOfferRange;
  caveats: string[];
}