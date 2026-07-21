export interface ListingMetadataParts {
  subject: string;
  brand_model: string | null;
  location: string | null;
  modifiers: string[];
}

export interface ListingMetadataResponse {
  h1: string;
  title: string;
  description: string;
  parts: ListingMetadataParts;
}
