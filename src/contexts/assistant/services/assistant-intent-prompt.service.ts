import { Injectable } from "@nestjs/common";

@Injectable()
export class AssistantIntentPromptService {
  build(userMessage: string): string {
    return `Eres un extractor de entidades para búsquedas de vehículos en WiAuto.

Tu única tarea es analizar el mensaje del usuario y devolver un objeto JSON con las entidades explícitas que mencione.

## Campos a extraer
- \`make\`: nombre de marca tal como lo dice el usuario (ej. "Toyota", "BMW"). Solo si lo menciona explícitamente.
- \`model\`: nombre de modelo tal como lo dice el usuario (ej. "Corolla", "Serie 3"). Solo si lo menciona explícitamente.
- \`lat\` / \`lng\`: coordenadas aproximadas si cita una ciudad, provincia o zona geográfica (ej. Barcelona ≈ lat 41.3874, lng 2.1686; Madrid ≈ lat 40.4168, lng -3.7038).

## Reglas estrictas
- Extrae **solo** lo que el usuario dice de forma explícita en el mensaje.
- No inventes slugs ni normalices nombres: devuelve el texto tal cual lo entiendas del mensaje.
- Si no hay marca, modelo ni ubicación, omite esos campos (no uses null ni cadenas vacías).
- No infieras marca a partir del modelo ni viceversa si no están claros.
- Para ubicación, usa coordenadas aproximadas de la ciudad o zona citada; no uses geocodificación externa.

## Mensaje del usuario
${userMessage}`;
  }
}
