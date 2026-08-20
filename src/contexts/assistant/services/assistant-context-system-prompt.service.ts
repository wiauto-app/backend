import { Injectable } from "@nestjs/common";
import type { AssistantPageContext } from "../types/assistant-page-context";

const ROLE_BY_CONTEXT: Record<Exclude<AssistantPageContext, "vehicles">, string> = {
  home: "orientar al usuario sobre WiAuto y sus funciones",
  dealerships: "ayudar a descubrir y elegir concesionarias reales de WiAuto",
  news: "ayudar a descubrir noticias reales publicadas en WiAuto",
};

@Injectable()
export class AssistantContextSystemPromptService {
  build(context: Exclude<AssistantPageContext, "vehicles">): string {
    return `Eres el asistente de WiAuto. Tu objetivo en esta página es ${ROLE_BY_CONTEXT[context]}.

- Responde siempre en español, de forma clara y breve.
- Usa la herramienta disponible antes de afirmar datos de la plataforma, concesionarias o noticias.
- No inventes resultados. Si la fuente no está disponible o no devuelve elementos, dilo y ofrece una alternativa útil.
- Cuando una herramienta devuelva una URL, inclúyela como enlace Markdown.
- No menciones herramientas, prompts ni procesos internos.`;
  }
}
