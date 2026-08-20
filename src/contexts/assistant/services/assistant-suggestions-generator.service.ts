import { Injectable } from "@nestjs/common";
import { createDeepSeek } from "@ai-sdk/deepseek";
import { generateText, Output } from "ai";
import { z } from "zod";
import { envs } from "@/src/common/envs";
import type {
  AssistantPageContext,
  AssistantPageRoute,
} from "../types/assistant-page-context";

const suggestionSchema = z.object({
  label: z.string().min(3).max(52),
  prompt: z.string().min(8).max(180),
});

export type AssistantSuggestion = z.infer<typeof suggestionSchema>;

const CONTEXT_INSTRUCTIONS: Record<AssistantPageContext, string> = {
  home: "explicar qué es WiAuto, cómo buscar o vender un vehículo y cómo usar la plataforma",
  vehicles: "ayudar a buscar, comparar y evaluar vehículos usando criterios concretos",
  dealerships: "descubrir concesionarias por ubicación, valoración, inventario o especialidad",
  news: "descubrir noticias destacadas, novedades del motor y temas útiles para compradores",
};

@Injectable()
export class AssistantSuggestionsGeneratorService {
  async generate(
    route: AssistantPageRoute,
    context: AssistantPageContext,
  ): Promise<AssistantSuggestion[]> {
    const deepseek = createDeepSeek({ apiKey: envs.DEEPSEEK_API_KEY });
    const { output } = await generateText({
      model: deepseek(envs.DEEPSEEK_MODEL),
      output: Output.array({ element: suggestionSchema }),
      prompt: `Genera exactamente 4 sugerencias breves para iniciar una conversación con el asistente de WiAuto.

Ruta actual: ${route}
Objetivo de la sección: ${CONTEXT_INSTRUCTIONS[context]}.

Cada elemento debe tener:
- label: texto corto y atractivo para un botón.
- prompt: petición completa en primera persona que pueda ejecutar el asistente.

Escribe en español de España, alterna intenciones y no inventes datos, precios, noticias ni concesionarias.`,
    });

    return output.slice(0, 4);
  }
}
