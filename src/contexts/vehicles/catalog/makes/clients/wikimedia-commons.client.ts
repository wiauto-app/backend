import { Injectable } from "@nestjs/common";

const WIKIMEDIA_API_BASE = "https://commons.wikimedia.org/w/api.php";
const USER_AGENT = "WiAuto/1.0 (https://wiauto.es; support@wiauto.es)";
const REQUEST_DELAY_MS = 250;

export interface WikimediaSvgSearchResult {
  title: string;
  url: string;
  mime: string | null;
}

interface WikimediaImageInfo {
  url?: string;
  mime?: string;
}

interface WikimediaPage {
  title?: string;
  imageinfo?: WikimediaImageInfo[];
}

interface WikimediaSearchResponse {
  query?: {
    pages?: Record<string, WikimediaPage>;
  };
}

@Injectable()
export class WikimediaCommonsClient {
  async searchSvgLogo(search_query: string): Promise<WikimediaSvgSearchResult | null> {
    const params = new URLSearchParams({
      action: "query",
      format: "json",
      origin: "*",
      generator: "search",
      gsrnamespace: "6",
      gsrlimit: "10",
      gsrsearch: `${search_query} filemime:image/svg+xml`,
      prop: "imageinfo",
      iiprop: "url|mime|extmetadata",
    });

    const response = await fetch(`${WIKIMEDIA_API_BASE}?${params.toString()}`, {
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(
        `Wikimedia search falló con HTTP ${response.status}`,
      );
    }

    const payload = (await response.json()) as WikimediaSearchResponse;
    const pages = Object.values(payload.query?.pages ?? {});
    if (pages.length === 0) {
      return null;
    }

    const ranked = pages
      .map((page) => {
        const image_info = page.imageinfo?.[0];
        const title = page.title ?? "";
        const url = image_info?.url;
        const mime = image_info?.mime ?? null;
        if (!url || !title) {
          return null;
        }
        if (mime && mime !== "image/svg+xml") {
          return null;
        }
        return {
          title,
          url,
          mime,
          score: this.score_result(title, search_query),
        };
      })
      .filter(
        (item): item is WikimediaSvgSearchResult & { score: number } =>
          item !== null,
      )
      .sort((a, b) => b.score - a.score);

    if (ranked.length === 0) {
      return null;
    }

    const best = ranked[0];
    return {
      title: best.title,
      url: best.url,
      mime: best.mime,
    };
  }

  async downloadBytes(url: string): Promise<Buffer> {
    const response = await fetch(url, {
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "image/svg+xml,*/*",
      },
    });

    if (!response.ok) {
      throw new Error(
        `Descarga Wikimedia falló con HTTP ${response.status}`,
      );
    }

    return Buffer.from(await response.arrayBuffer());
  }

  async delayBetweenRequests(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, REQUEST_DELAY_MS));
  }

  private score_result(title: string, search_query: string): number {
    const normalized_title = title.toLowerCase();
    const query_tokens = search_query
      .toLowerCase()
      .replace(/logo/g, " ")
      .split(/\s+/)
      .map((token) => token.trim())
      .filter((token) => token.length > 1);

    let score = 0;
    if (normalized_title.includes("logo")) {
      score += 10;
    }
    for (const token of query_tokens) {
      if (normalized_title.includes(token)) {
        score += 5;
      }
    }
    if (normalized_title.endsWith(".svg")) {
      score += 2;
    }
    return score;
  }
}
