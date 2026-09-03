export type AnalyzeListingVerdict = "recomendable" | "riesgosa";

export interface AnalyzeListingChecklistItem {
  id: string;
  label: string;
  status: "ok" | "warn" | "missing";
  detail?: string;
}

export interface AnalyzeListingRisk {
  id: string;
  label: string;
  severity: "low" | "medium" | "high";
  detail?: string;
}

export interface AnalyzeListingResult {
  vehicle_id: string;
  ref: string | null;
  verdict: AnalyzeListingVerdict;
  checklist: AnalyzeListingChecklistItem[];
  risks: AnalyzeListingRisk[];
  summary: string;
}
