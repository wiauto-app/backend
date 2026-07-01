import { Injectable } from "@nestjs/common";
import { AssistantFilterCatalog } from "../types/assistant-filter-catalog";
import { AssistantResolvedEntities } from "../types/assistant-resolved-entities";

@Injectable()
export class AssistantSearchFiltersPromptService {
  build(params: {
    userMessage: string;
    catalog: AssistantFilterCatalog;
    resolved: AssistantResolvedEntities;
  }): string {
    const { userMessage, catalog, resolved } = params;
    const catalogJson = JSON.stringify(catalog, null, 2);
    const resolvedJson = JSON.stringify(resolved, null, 2);

    return `Eres un formateador de filtros de búsqueda de vehículos para WiAuto.

Tu tarea es convertir la intención del usuario en un objeto de filtros válido para la búsqueda de anuncios.

## Entidades ya resueltas (obligatorias si existen)
${resolvedJson}

- Si \`make_slug\` está presente, inclúyelo en \`makes_slugs\` con ese slug exacto.
- Si \`model_slug\` está presente, inclúyelo en \`models_slugs\` con ese slug exacto.
- Si \`lat\` y \`lng\` están presentes, inclúyelos y usa \`radius\` 25000 (metros) salvo que el usuario pida otro radio.

## Catálogo de filtros disponibles
${catalogJson}

## Reglas
- Mapea presupuesto, combustible, tipo de vehículo, transmisión, color, equipamiento, etiqueta DGT, servicios, cuotas, tracción y garantía usando **solo** slugs o ids del catálogo.
- Para etiquetas DGT usa \`dgt_label_ids\` con el campo \`id\` (UUID), no el slug.
- Para \`features_slugs\`, todos los slugs indicados se combinan con lógica AND.
- No inventes slugs ni ids que no estén en el catálogo o en las entidades resueltas.
- Omite campos que el usuario no haya mencionado implícita o explícitamente.

## Mensaje del usuario
${userMessage}`;
  }
}
