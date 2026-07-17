import { PaginationFilter } from "@/src/contexts/shared/types/pagination.filter";

export interface DealershipsFilterOptions {
  page?: number;
  limit?: number;
  query?: string;
  order_by?: string;
  order_direction?: "ASC" | "DESC";
  name?: string;
  slug?: string;
  email?: string;
  is_featured?: boolean;
  lat?: number;
  lng?: number;
  radius?: number;
  province_slug?: string;
  rating_since?: number;
  vehicles_number?: number;
}

export class DealershipsFilter extends PaginationFilter {
  name?: string;
  slug?: string;
  email?: string;
  is_featured?: boolean;
  lat?: number;
  lng?: number;
  radius?: number;
  province_slug?: string;
  rating_since?: number;
  vehicles_number?: number;

  constructor(options: DealershipsFilterOptions = {}) {
    const {
      page = 1,
      limit = 10,
      query,
      order_by,
      order_direction,
      name,
      slug,
      email,
      is_featured,
      lat,
      lng,
      radius,
      province_slug,
      rating_since,
      vehicles_number,
    } = options;
    super(page, limit, order_direction, query, order_by);
    this.name = name;
    this.slug = slug;
    this.email = email;
    this.is_featured = is_featured;
    this.lat = lat;
    this.lng = lng;
    this.radius = radius;
    this.province_slug = province_slug;
    this.rating_since = rating_since;
    this.vehicles_number = vehicles_number;
  }
}
