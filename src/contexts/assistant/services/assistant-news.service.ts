import { Injectable } from "@nestjs/common";
import { envs } from "@/src/common/envs";

interface StrapiNewsEntry {
  titulo?: string;
  title?: string;
  slug?: string;
  resumen?: string;
  summary?: string;
  publishedAt?: string;
  attributes?: Omit<StrapiNewsEntry, "attributes">;
}

export interface AssistantNewsItem {
  title: string;
  summary: string;
  url: string;
  published_at?: string;
}

@Injectable()
export class AssistantNewsService {
  async findHighlights(options: {
    featured?: boolean;
    category?: string;
  }): Promise<{ available: boolean; items: AssistantNewsItem[] }> {
    if (!envs.STRAPI_API_URL) {
      return { available: false, items: [] };
    }

    const params = new URLSearchParams({
      sort: "publishedAt:desc",
      "pagination[pageSize]": "5",
    });

    if (options.featured) {
      params.set("filters[destacada][$eq]", "true");
    }
    if (options.category) {
      params.set("filters[categoria_noticia][slug][$eq]", options.category);
    }

    const baseUrl = envs.STRAPI_API_URL.replace(/\/$/, "");
    const response = await fetch(`${baseUrl}/api/noticias?${params}`, {
      headers: envs.STRAPI_API_TOKEN
        ? { Authorization: `Bearer ${envs.STRAPI_API_TOKEN}` }
        : undefined,
    });

    if (!response.ok) {
      return { available: false, items: [] };
    }

    const payload = (await response.json()) as { data?: StrapiNewsEntry[] };
    const items = (payload.data ?? []).flatMap((entry) => {
      const item = entry.attributes ?? entry;
      const title = item.titulo ?? item.title;
      if (!title || !item.slug) {
        return [];
      }

      return [{
        title,
        summary: item.resumen ?? item.summary ?? "",
        url: `/noticias/${item.slug}`,
        published_at: item.publishedAt,
      }];
    });

    return { available: true, items };
  }
}
