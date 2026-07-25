import { z } from "zod";
import { tool, generateText, Output } from "ai";
import { createDeepSeek } from "@ai-sdk/deepseek";
import { envs } from "@/src/common/envs";
import { VehicleService } from "@/src/contexts/vehicles/services/vehicle.service";
import { buildAssistantVehicleSummary } from "../helpers/build-assistant-vehicle-summary";
import type { AnalyzeListingResult } from "../types/analyze-listing";

const analyzeListingInputSchema = z.object({
  vehicle_id: z.string().uuid(),
});

const analyzeListingOutputSchema = z.object({
  verdict: z.enum(["recomendable", "riesgosa"]),
  checklist: z
    .array(
      z.object({
        id: z.string(),
        label: z.string(),
        status: z.enum(["ok", "warn", "missing"]),
        detail: z.string().optional(),
      }),
    )
    .min(3)
    .max(10),
  risks: z
    .array(
      z.object({
        id: z.string(),
        label: z.string(),
        severity: z.enum(["low", "medium", "high"]),
        detail: z.string().optional(),
      }),
    )
    .max(8),
  summary: z.string(),
});

interface CreateAnalyzeListingToolOptions {
  vehicleService: VehicleService;
}

export const createAnalyzeListingTool = ({
  vehicleService,
}: CreateAnalyzeListingToolOptions) =>
  tool({
    description:
      "Analiza un anuncio concreto por UUID y devuelve veredicto (recomendable/riesgosa), checklist y riesgos. OBLIGATORIA cuando el usuario elige / le gusta un vehículo y pide explicar o analizar el anuncio. NUNCA uses searchVehicles en su lugar.",
    inputSchema: analyzeListingInputSchema,
    execute: async ({ vehicle_id }): Promise<AnalyzeListingResult> => {
      const detail = await vehicleService.findOne({ id: vehicle_id });
      const summary = buildAssistantVehicleSummary(detail);

      const deepseek = createDeepSeek({
        apiKey: envs.DEEPSEEK_API_KEY,
      });

      const { output } = await generateText({
        model: deepseek(envs.DEEPSEEK_MODEL),
        output: Output.object({
          schema: analyzeListingOutputSchema,
        }),
        prompt: `Eres un analista de anuncios de coches usados en España para WiAuto.
Evalúa el anuncio con datos reales (no inventes campos ausentes). Sé prudente pero práctico.

Datos del anuncio (JSON):
${JSON.stringify(
  {
    ...summary,
    has_whatsapp: detail.has_whatsapp,
    show_phone: detail.show_phone,
    images_count: detail.images?.length ?? 0,
    features: detail.features?.map((item) => item.name) ?? [],
    services: detail.services?.map((item) => item.name) ?? [],
  },
  null,
  2,
)}

Devuelve:
- verdict: "recomendable" o "riesgosa"
- checklist: puntos a revisar (fotos, precio vs mercado aparente, km/año, garantía, contacto, descripción)
- risks: riesgos concretos si los hay
- summary: 2–3 frases en español neutro`,
      });

      return {
        vehicle_id,
        ...output,
      };
    },
  });
