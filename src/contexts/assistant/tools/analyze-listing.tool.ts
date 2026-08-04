import { z } from "zod";
import { tool, generateText, Output } from "ai";
import { createDeepSeek } from "@ai-sdk/deepseek";
import { envs } from "@/src/common/envs";
import { VehicleService } from "@/src/contexts/vehicles/services/vehicle.service";
import { buildAssistantVehicleSummary } from "../helpers/build-assistant-vehicle-summary";
import {
  assistantVehicleTargetSchema,
  resolveAssistantVehicleId,
} from "../helpers/resolve-assistant-vehicle-id";
import type { AnalyzeListingResult } from "../types/analyze-listing";

const analyzeListingOutputSchema = z.object({
  verdict: z.enum(["recomendable", "riesgosa"]),
  checklist: z
    .array(
      z.object({
        id: z.string(),
        label: z.string(),
        status: z.enum(["ok", "warn", "missing"]),
        detail: z.string().nullable().optional(),
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
        detail: z.string().nullable().optional(),
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
      "Analiza un anuncio concreto por referencia numérica (vehicle_ref preferido) o UUID interno (vehicle_id) y devuelve veredicto (recomendable/riesgosa), checklist y riesgos. OBLIGATORIA cuando el usuario elige / le gusta un vehículo y pide explicar o analizar el anuncio. Usa Ref. N del listado (vehicle_ref). NUNCA uses searchVehicles en su lugar.",
    inputSchema: assistantVehicleTargetSchema,
    execute: async (
      input,
    ): Promise<AnalyzeListingResult | { error: string }> => {
      try {
        const vehicle_id = await resolveAssistantVehicleId(input, {
          vehicleService,
        });
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
Devuelve SOLO un objeto JSON válido según el schema.

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
- risks: riesgos concretos si los hay (puede ser array vacío)
- summary: 2–3 frases en español neutro`,
        });

        if (!output) {
          return {
            error:
              "No se pudo generar el análisis estructurado del anuncio. Inténtalo de nuevo.",
          };
        }

        return {
          vehicle_id,
          ref: summary.ref,
          verdict: output.verdict,
          checklist: output.checklist.map((item) => ({
            ...item,
            detail: item.detail ?? undefined,
          })),
          risks: output.risks.map((item) => ({
            ...item,
            detail: item.detail ?? undefined,
          })),
          summary: output.summary,
        };
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Error al analizar el anuncio";
        return { error: message };
      }
    },
  });
