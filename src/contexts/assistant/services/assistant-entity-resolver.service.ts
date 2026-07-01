import { Injectable } from "@nestjs/common";
import { slugify } from "@/src/contexts/shared/slugify-string/slugify";
import { MakesUseCase } from "@/src/contexts/vehicles/catalog/makes/application/makes-use-cases/makes.use-case";
import { CatalogModelsUseCase } from "@/src/contexts/vehicles/catalog/models/application/catalog-models-use-cases/catalog-models.use-case";
import { AssistantIntent } from "../types/assistant-intent";
import { AssistantResolvedEntities } from "../types/assistant-resolved-entities";

const SEARCH_LIMIT = 15;

type SlugNameCandidate = {
  id?: number;
  slug: string;
  name: string;
};

const mergeUniqueBySlug = <T extends SlugNameCandidate>(items: T[]): T[] => {
  const seen = new Set<string>();
  const merged: T[] = [];

  for (const item of items) {
    if (seen.has(item.slug)) {
      continue;
    }

    seen.add(item.slug);
    merged.push(item);
  }

  return merged;
};

const rankCandidate = (
  candidates: SlugNameCandidate[],
  query: string,
  slugifiedQuery: string,
): SlugNameCandidate | undefined => {
  if (candidates.length === 0) {
    return undefined;
  }

  const exactSlug = candidates.find((candidate) => candidate.slug === slugifiedQuery);
  if (exactSlug) {
    return exactSlug;
  }

  const normalizedQuery = query.toLowerCase();
  const exactName = candidates.find(
    (candidate) => candidate.name.toLowerCase() === normalizedQuery,
  );
  if (exactName) {
    return exactName;
  }

  return candidates[0];
};

@Injectable()
export class AssistantEntityResolverService {
  constructor(
    private readonly makesUseCase: MakesUseCase,
    private readonly catalogModelsUseCase: CatalogModelsUseCase,
  ) {}

  async resolve(intent: AssistantIntent): Promise<AssistantResolvedEntities> {
    const make_slug = intent.make
      ? await this.resolveMakeSlug(intent.make)
      : undefined;
    const model_slug =
      intent.model && make_slug
        ? await this.resolveModelSlug(intent.model, make_slug)
        : undefined;

    return {
      make_slug,
      model_slug,
      lat: intent.lat,
      lng: intent.lng,
    };
  }

  private async resolveMakeSlug(text: string): Promise<string | undefined> {
    const query = text.trim();
    const slugifiedQuery = slugify(query);

    const [byText, bySlug] = await Promise.all([
      this.makesUseCase.findSearchMakes({
        search: query,
        limit: SEARCH_LIMIT,
        page: 1,
        order_direction: "ASC",
      }),
      query === slugifiedQuery
        ? Promise.resolve({ makes: [] as SlugNameCandidate[] })
        : this.makesUseCase.findSearchMakes({
            search: slugifiedQuery,
            limit: SEARCH_LIMIT,
            page: 1,
            order_direction: "ASC",
          }),
    ]);

    const candidates = mergeUniqueBySlug([...byText.makes, ...bySlug.makes]);
    return rankCandidate(candidates, query, slugifiedQuery)?.slug;
  }

  private async resolveModelSlug(
    text: string,
    make_slug: string,
  ): Promise<string | undefined> {
    const make_id = await this.resolveMakeId(make_slug);
    if (make_id === undefined) {
      return undefined;
    }

    const query = text.trim();
    const slugifiedQuery = slugify(query);

    const [byText, bySlug] = await Promise.all([
      this.catalogModelsUseCase.findSearchModels({
        make_id,
        search: query,
        limit: SEARCH_LIMIT,
        page: 1,
        order_direction: "ASC",
      }),
      query === slugifiedQuery
        ? Promise.resolve({ models: [] as SlugNameCandidate[] })
        : this.catalogModelsUseCase.findSearchModels({
            make_id,
            search: slugifiedQuery,
            limit: SEARCH_LIMIT,
            page: 1,
            order_direction: "ASC",
          }),
    ]);

    const candidates = mergeUniqueBySlug([...byText.models, ...bySlug.models]);
    return rankCandidate(candidates, query, slugifiedQuery)?.slug;
  }

  private async resolveMakeId(make_slug: string): Promise<number | undefined> {
    const slugifiedQuery = slugify(make_slug);

    const [byText, bySlug] = await Promise.all([
      this.makesUseCase.findSearchMakes({
        search: make_slug,
        limit: SEARCH_LIMIT,
        page: 1,
        order_direction: "ASC",
      }),
      make_slug === slugifiedQuery
        ? Promise.resolve({ makes: [] as SlugNameCandidate[] })
        : this.makesUseCase.findSearchMakes({
            search: slugifiedQuery,
            limit: SEARCH_LIMIT,
            page: 1,
            order_direction: "ASC",
          }),
    ]);

    const candidates = mergeUniqueBySlug([...byText.makes, ...bySlug.makes]);
    const best = rankCandidate(candidates, make_slug, slugifiedQuery);
    return best?.id;
  }
}
