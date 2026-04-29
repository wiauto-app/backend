import slugify_impl from "slugify";

export function slugify(text: string): string {
  return slugify_impl(text, {
    lower: true,
    strict: true,
    trim: true,
  });
}