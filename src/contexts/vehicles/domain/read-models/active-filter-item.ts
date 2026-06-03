export interface ActiveFilterItem {
  id: string | number;
  slug: string;
  name: string;
  make_id?: number;
  model_id?: number;
  hex_code?: string;
  value?: number;
  code?: string;
}
