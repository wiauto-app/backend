export interface VehicleAddressDetails {
  street?: string | null;
  route?: string | null;
  street_number?: string | null;
  neighborhood?: string | null;
  municipality?: string | null;
  province?: string | null;
  postal_code?: string | null;
  country?: string | null;
  formatted_lines: string[];
}
