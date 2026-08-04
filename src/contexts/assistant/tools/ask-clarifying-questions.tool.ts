import { z } from "zod";
import { tool, generateText, Output } from "ai";
import { createDeepSeek } from "@ai-sdk/deepseek";
import { envs } from "@/src/common/envs";
import { searchVehiclesInputSchema } from "../schemas/search-vehicles.schema";
import type { SearchVehiclesInput } from "../schemas/search-vehicles.schema";
import type { AskClarifyingQuestionsResult } from "../types/ask-clarifying-questions";
import type { AssistantFilterCatalog } from "../types/assistant-filter-catalog";

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
  catalog: AssistantFilterCatalog;
}

const toSlugNameList = (
  items: Array<{ slug: string; name: string }>,
): Array<{ slug: string; name: string }> =>
  items.map(({ slug, name }) => ({ slug, name }));

export const createAskClarifyingQuestionsTool = ({
  initialFilters,
  catalog,
}: CreateAskClarifyingQuestionsToolOptions) =>
  tool({
    description:
      "Genera 2–4 preguntas de clarificación con opciones tipo chip para completar el perfil de compra. Úsala cuando falten criterios clave (presupuesto, uso, ubicación, tipo, etc.).",
    inputSchema: askClarifyingQuestionsInputSchema,
    execute: async ({
      reason,
      focus,
    }): Promise<AskClarifyingQuestionsResult> => {
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

## Catálogo real de slugs (OBLIGATORIO en filter_patch)
### Tipos de vehículo → \`type_slug\` (carrocería: sedán, SUV, etc.)
${JSON.stringify(toSlugNameList(catalog.vehicleTypes), null, 2)}

### Categorías → \`categories_slugs\` (categorías comerciales; NUNCA tipos de vehículo)
${JSON.stringify(toSlugNameList(catalog.categories), null, 2)}

### Otros slugs válidos
${JSON.stringify(
  {
    fuels: toSlugNameList(catalog.fuels),
    colors: toSlugNameList(catalog.colors),
    features: toSlugNameList(catalog.features),
    services: toSlugNameList(catalog.services),
    cuotas: toSlugNameList(catalog.cuotas),
    tractions: toSlugNameList(catalog.tractions),
    warranties: toSlugNameList(catalog.warranties),
    dgtLabels: catalog.dgtLabels.map(({ id, slug, name }) => ({
      id,
      slug,
      name,
    })),
  },
  null,
  2,
)}

Reglas:
- Genera 2–4 preguntas cortas en español neutro. Cada pregunta 2–6 opciones con id y label claros.
- Si una opción implica filtros, incluye filter_patch SOLO con slugs/ids del catálogo anterior.
- "Sedán/SUV/berlina/familiar" → \`type_slug\`, NUNCA \`categories_slugs\`.
- Categorías comerciales del listing → \`categories_slugs\`, NUNCA \`type_slug\`.
- No preguntes lo que ya está resuelto en los filtros iniciales.
- multi=true solo si el usuario puede elegir varias opciones a la vez.`,
      });

      return output;
    },
  });
