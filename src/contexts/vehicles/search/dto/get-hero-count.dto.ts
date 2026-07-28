export interface GetHeroCountDto {
  make_slugs?: string[];
  model_slugs?: string[];
  province_slug?: string;
  municipality_slug?: string;
  until_price?: number;
}
