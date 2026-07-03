import { Injectable } from "@nestjs/common";
import { AssistantFilterCatalog } from "../types/assistant-filter-catalog";
import { AssistantIntent } from "../types/assistant-intent";
import { AssistantResolvedEntities } from "../types/assistant-resolved-entities";

@Injectable()
export class AssistantSearchFiltersPromptService {
  build(params: {
    userMessage: string;
    catalog: AssistantFilterCatalog;
    intent: AssistantIntent;
    resolved: AssistantResolvedEntities;
  }): string {
    const { userMessage, catalog, intent, resolved } = params;
    const catalogJson = JSON.stringify(catalog, null, 2);
    const intentJson = JSON.stringify(intent, null, 2);
    const resolvedJson = JSON.stringify(resolved, null, 2);

    return `Eres un formateador de filtros de búsqueda de vehículos para WiAuto.

Tu tarea es convertir **solo lo que el usuario dice explícitamente** en un objeto de filtros válido.

## Menciones explícitas del usuario (fuente de verdad)
${intentJson}

## Slugs resueltos en catálogo (solo para los campos anteriores)
${resolvedJson}

## Reglas estrictas sobre marca y modelo
- Incluye \`makes_slugs\` **solo** si el usuario mencionó una marca en el mensaje y existe \`make\` en las menciones explícitas.
- Incluye \`models_slugs\` **solo** si el usuario mencionó un modelo en el mensaje y existe \`model\` en las menciones explícitas.
- Si el usuario solo nombra un modelo, devuelve únicamente \`models_slugs\` con el slug resuelto.

## Ubicación
- Incluye \`lat\`, \`lng\` y \`radius\` solo si el usuario mencionó una ubicación en el mensaje.
- Si hay coordenadas, usa \`radius\` 25000 salvo que el usuario pida otro radio.

## Otros filtros del catálogo
${catalogJson}

- Mapea presupuesto, combustible, tipo de vehículo, transmisión, color, equipamiento, etiqueta DGT, servicios, cuotas, tracción y garantía **solo** si el usuario los menciona de forma explícita en el mensaje.
- Para etiquetas DGT usa \`dgt_label_ids\` con el campo \`id\` (UUID), no el slug.
- No inventes slugs ni ids que no estén en el catálogo.
- Si el usuario no menciona un filtro, **omítelo** por completo (no uses null ni valores por defecto).

## Mensaje del usuario
${userMessage}`;
  }
}
