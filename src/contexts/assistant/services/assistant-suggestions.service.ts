import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Inject, Injectable } from "@nestjs/common";
import type { Cache } from "cache-manager";
import type { AssistantPageRoute } from "../types/assistant-page-context";
import { resolveAssistantPageContext } from "../types/assistant-page-context";
import {
  AssistantSuggestionsGeneratorService,
  type AssistantSuggestion,
} from "./assistant-suggestions-generator.service";

const TWO_WEEKS_MS = 14 * 24 * 60 * 60 * 1000;
const CACHE_VERSION = "v1";

const FALLBACK_SUGGESTIONS: Record<AssistantPageRoute, AssistantSuggestion[]> = {
  "/": [
    { label: "¿Qué es WiAuto?", prompt: "Explícame qué es WiAuto y cómo puede ayudarme." },
    { label: "Encontrar mi próximo coche", prompt: "Ayúdame a entender cómo puedo encontrar mi próximo coche en WiAuto." },
    { label: "Vender un vehículo", prompt: "Quiero saber cómo publicar y vender un vehículo en WiAuto." },
    { label: "Conocer la plataforma", prompt: "Muéstrame las funciones principales que ofrece WiAuto." },
  ],
  "/vehiculos": [
    { label: "Coche para mi presupuesto", prompt: "Ayúdame a buscar un coche que encaje con mi presupuesto y necesidades." },
    { label: "Comparar dos modelos", prompt: "Quiero comparar dos modelos antes de decidir cuál comprar." },
    { label: "Automático y eficiente", prompt: "Busca vehículos automáticos, eficientes y con pocos kilómetros." },
    { label: "Analizar un anuncio", prompt: "Ayúdame a analizar si un anuncio de vehículo es una buena opción." },
  ],
  "/concesionarias": [
    { label: "Concesionarias cercanas", prompt: "Busca concesionarias cerca de mi ubicación." },
    { label: "Mejor valoradas", prompt: "Enséñame concesionarias con buenas valoraciones." },
    { label: "Con más vehículos", prompt: "Quiero encontrar concesionarias con un inventario amplio de vehículos." },
    { label: "Elegir concesionaria", prompt: "Ayúdame a elegir una concesionaria según mis necesidades." },
  ],
  "/noticias": [
    { label: "Noticias destacadas", prompt: "Muéstrame las noticias destacadas más recientes de WiAuto." },
    { label: "Novedades del motor", prompt: "Quiero conocer las novedades recientes del mundo del motor." },
    { label: "Consejos para comprar", prompt: "Busca noticias con consejos útiles para comprar un vehículo." },
    { label: "Movilidad sostenible", prompt: "Enséñame noticias recientes sobre vehículos eléctricos y movilidad sostenible." },
  ],
};

export interface AssistantSuggestionsResult {
  route: AssistantPageRoute;
  context: ReturnType<typeof resolveAssistantPageContext>;
  suggestions: AssistantSuggestion[];
}

@Injectable()
export class AssistantSuggestionsService {
  private readonly inFlight = new Map<AssistantPageRoute, Promise<AssistantSuggestion[]>>();

  constructor(
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
    private readonly generator: AssistantSuggestionsGeneratorService,
  ) {}

  async getForRoute(route: AssistantPageRoute): Promise<AssistantSuggestionsResult> {
    const context = resolveAssistantPageContext(route);
    const cacheKey = `assistant:suggestions:${CACHE_VERSION}:${route}`;
    const cached = await this.cache.get<AssistantSuggestion[]>(cacheKey);

    if (cached?.length) {
      return { route, context, suggestions: cached };
    }

    let pending = this.inFlight.get(route);
    if (!pending) {
      pending = this.generateAndCache(route, cacheKey);
      this.inFlight.set(route, pending);
    }

    const suggestions = await pending.finally(() => this.inFlight.delete(route));
    return { route, context, suggestions };
  }

  private async generateAndCache(
    route: AssistantPageRoute,
    cacheKey: string,
  ): Promise<AssistantSuggestion[]> {
    const context = resolveAssistantPageContext(route);
    let suggestions: AssistantSuggestion[];

    try {
      suggestions = await this.generator.generate(route, context);
      if (suggestions.length !== 4) suggestions = FALLBACK_SUGGESTIONS[route];
    } catch {
      suggestions = FALLBACK_SUGGESTIONS[route];
    }

    await this.cache.set(cacheKey, suggestions, TWO_WEEKS_MS);
    return suggestions;
  }
}
