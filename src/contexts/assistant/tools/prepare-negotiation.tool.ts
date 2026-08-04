import { z } from "zod";
import { tool, generateText, Output } from "ai";
import { createDeepSeek } from "@ai-sdk/deepseek";
import { envs } from "@/src/common/envs";
import { VehicleService } from "@/src/contexts/vehicles/services/vehicle.service";
import { buildAssistantVehicleSummary } from "../helpers/build-assistant-vehicle-summary";
import { resolveAssistantVehicleId } from "../helpers/resolve-assistant-vehicle-id";
import type { PrepareNegotiationResult } from "../types/prepare-negotiation";

const prepareNegotiationInputSchema = z
  .object({
    vehicle_ref: z.number().int().positive().optional(),
    vehicle_id: z.string().uuid().optional(),
    user_budget: z.number().positive().optional(),
  })
  .refine(
    (data) => data.vehicle_ref != null || Boolean(data.vehicle_id),
    { message: "Se requiere vehicle_ref o vehicle_id" },
  );

const prepareNegotiationOutputSchema = z.object({
  talking_points: z.array(z.string()).min(2).max(8),
  offer_range: z
    .object({
      min: z.number(),
      max: z.number(),
      currency: z.literal("EUR"),
    })
    .optional(),
  caveats: z.array(z.string()).max(6),
});

interface CreatePrepareNegotiationToolOptions {
  vehicleService: VehicleService;
}

export const createPrepareNegotiationTool = ({
  vehicleService,
}: CreatePrepareNegotiationToolOptions) =>
  tool({
    description:
      "OBLIGATORIA cuando el usuario pide negociar / preparar oferta / argumentos de precio sobre un anuncio concreto. Prepara talking points, rango de oferta orientativo y advertencias. Prefiere vehicle_ref (Ref. N); vehicle_id UUID solo como fallback. NUNCA uses searchVehicles ni inventes otros nombres de tool.",
    inputSchema: prepareNegotiationInputSchema,
    execute: async ({
      vehicle_ref,
      vehicle_id: inputVehicleId,
      user_budget,
    }): Promise<PrepareNegotiationResult> => {
      const vehicle_id = await resolveAssistantVehicleId(
        { vehicle_ref, vehicle_id: inputVehicleId },
        { vehicleService },
      );
      const detail = await vehicleService.findOne({ id: vehicle_id });
      const summary = buildAssistantVehicleSummary(detail);

      const deepseek = createDeepSeek({
        apiKey: envs.DEEPSEEK_API_KEY,
      });

      const { output } = await generateText({
        model: deepseek(envs.DEEPSEEK_MODEL),
        output: Output.object({
          schema: prepareNegotiationOutputSchema,
        }),
        prompt: `Eres coach de negociación de coches usados en España (WiAuto).
Sé realista: no prometas descuentos imposibles. Habla en español neutro.

Anuncio (JSON):
${JSON.stringify(summary, null, 2)}

Presupuesto del usuario (opcional): ${user_budget ?? "no indicado"}

Devuelve:
- talking_points: argumentos concretos (km, año, estado, mercado aparente, urgencia del vendedor si se deduce)
- offer_range: rango orientativo en EUR si tiene sentido (min/max <= precio anunciado)
- caveats: advertencias (inspección, historial, no firmar sin revisión, etc.)`,
      });

      return {
        vehicle_id,
        ref: summary.ref,
        ...output,
      };
    },
  });
