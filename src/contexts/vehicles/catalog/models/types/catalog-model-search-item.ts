/**
 * Proyección de búsqueda de modelos por marca (con conteo de vehículos).
 */
export interface CatalogModelSearchItem {
  id: number;
  make_id: number;
  model_id: number;
  name: string;
  slug: string;
  created_at: Date;
  vehicle_count: number;
}
