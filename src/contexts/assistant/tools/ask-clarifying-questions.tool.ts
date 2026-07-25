import { z } from "zod";
import { tool, generateText, Output } from "ai";
import { createDeepSeek } from "@ai-sdk/deepseek";
import { envs } from "@/src/common/envs";
import { searchVehiclesInputSchema } from "../schemas/search-vehicles.schema";
import type { SearchVehiclesInput } from "../schemas/search-vehicles.schema";
import type { AskClarifyingQuestionsResult } from "../types/ask-clarifying-questions";

const askClarifyingQuestionsInputSchema = z.object({
  reason: z.string().optional(),
  focus: z.string().optional(),
});

const clarifyingQuestionsOutputSchema = z.object({
  questions: z
    .array(
      z.object({
        id: z.string(),
        prompt: z.string(),
        multi: z.boolean(),
        options: z
          .array(
            z.object({
              id: z.string(),
              label: z.string(),
              filter_patch: searchVehiclesInputSchema.optional(),
            }),
          )
          .min(2)
          .max(6),
      }),
    )
    .min(2)
    .max(4),
});

interface CreateAskClarifyingQuestionsToolOptions {
  initialFilters?: SearchVehiclesInput;
}

export const createAskClarifyingQuestionsTool = ({
  initialFilters,
}: CreateAskClarifyingQuestionsToolOptions) =>
  tool({
    description:
      "Genera 2–4 preguntas de clarificación con opciones tipo chip para completar el perfil de compra. Úsala cuando falten criterios clave (presupuesto, uso, ubicación, tipo, etc.).",
    inputSchema: askClarifyingQuestionsInputSchema,
    execute: async ({ reason, focus }): Promise<AskClarifyingQuestionsResult> => {
      const deepseek = createDeepSeek({
        apiKey: envs.DEEPSEEK_API_KEY,
      });

      const { output } = await generateText({
        model: deepseek(envs.DEEPSEEK_MODEL),
        output: Output.object({
          schema: clarifyingQuestionsOutputSchema,
        }),
        prompt: `Eres planificador de preguntas para un asistente de compra de coches en España (WiAuto).

Filtros ya conocidos (JSON):
${JSON.stringify(initialFilters ?? {}, null, 2)}

Motivo: ${reason ?? "perfil incompleto"}
Foco: ${focus ?? "completar criterios de búsqueda"}

Genera 2–4 preguntas cortas en español neutro. Cada pregunta debe tener 2–6 opciones con id y label claros.
Si una opción implica filtros, incluye filter_patch con campos del schema de búsqueda (slugs reales razonables: p. ej. fuel_type_slugs, until_price, transmission_types, etc.).
No preguntes lo que ya está resuelto en los filtros iniciales.
multi=true solo si el usuario puede elegir varias opciones a la vez.`,
      });

      return output;
    },
  });
