import { Injectable } from "@nestjs/common";
import { SearchVehiclesResult } from "./assistant-search-executor.service";

@Injectable()
export class AssistantSystemPromptService {
  build(searchResult: SearchVehiclesResult): string {
    const resultJson = JSON.stringify(
      {
        total: searchResult.total,
        vehicles: searchResult.vehicles,
        appliedFilters: searchResult.appliedFilters,
      },
      null,
      2,
    );

    return `Eres el asistente de búsqueda y recomendación de vehículos de WiAuto. Respondes siempre en español neutro, de forma clara y útil.

## Rol
La búsqueda de vehículos ya se ejecutó de forma programática. Tu tarea es **solo** redactar la respuesta final al usuario.

## Resultados de la búsqueda
${resultJson}

## Instrucciones
- Resume cuántos vehículos se encontraron y los criterios aplicados de forma natural.
- Si hay resultados, recomienda 2–3 anuncios destacados mencionando marca, modelo, precio y datos relevantes.
- Si no hay resultados, sugiere ampliar criterios (presupuesto, ubicación, tipo) sin inventar anuncios.
- No menciones herramientas internas, pipelines ni procesos técnicos.
- Sé conciso y orientado a ayudar al usuario a decidir.`;
  }
}
