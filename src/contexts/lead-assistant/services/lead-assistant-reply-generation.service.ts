import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { envs } from "@/src/common/envs";
import { generateText, Output } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { z } from "zod";

import { mapDescriptionGenerationSettings } from "@/src/contexts/vehicles/services/description-generation-settings.mapper";
import { formatVehicleDisplayName } from "@/src/contexts/vehicles/utils/format-vehicle-display-name";
import type { VehicleDetail } from "@/src/contexts/vehicles/types/vehicle-detail";

import type { LeadAssistantSettingsEntity } from "../entities/lead-assistant-settings.entity";

const leadAssistantReplySchema = z.object({
  reply_text: z.string().min(1).max(1200),
  is_hot_lead: z.boolean(),
});

export interface LeadAssistantGeneratedReply {
  reply_text: string;
  is_hot_lead: boolean;
}

@Injectable()
export class LeadAssistantReplyGenerationService {
  private readonly openai = createOpenAI({
    apiKey: envs.OPENAI_API_KEY,
  });

  async generate(params: {
    vehicle: VehicleDetail;
    settings: LeadAssistantSettingsEntity;
    buyer_message: string;
    recent_messages: string;
  }): Promise<LeadAssistantGeneratedReply> {
    const vehicle = params.vehicle;
    const display_name = formatVehicleDisplayName({
      make_name: vehicle.version_summary.make_name,
      model_name: vehicle.version_summary.model_name,
      version_name: vehicle.version_summary.version_name,
    });
    const price = vehicle.price ?? vehicle.prices?.[0]?.price ?? null;

    const mapped = mapDescriptionGenerationSettings({
      objective: params.settings.objective,
      persuasion: params.settings.persuasion,
      extension: params.settings.extension,
      tone: params.settings.tone,
    });

    const seller_note = params.settings.context_note.trim();

    const prompt = `Eres el asistente de leads de WiAuto. Redactas UN mensaje de chat en español de España, en nombre del vendedor del anuncio, para responder a un comprador interesado.

## Reglas estrictas
- No inventes datos que no aparezcan abajo (precio, km, ubicación, equipamiento).
- Tono conversacional de chat (2-4 frases cortas; sin markdown).
- No prometas descuentos ni condiciones no indicadas.
- Si el comprador pide visita, reserva, financiación, prueba o muestra intención clara de comprar, marca is_hot_lead=true.

${mapped.preferences_block}

## Nota del vendedor
${seller_note || "(Sin nota adicional)"}

## Vehículo
- Anuncio: ${display_name}
- Precio: ${price != null ? `${price} €` : "no indicado"}
- Kilometraje: ${vehicle.mileage} km
- Combustible: ${vehicle.version_summary.fuel_name ?? "—"}
- Ubicación: ${vehicle.address ?? "España"}

## Mensaje del comprador
${params.buyer_message.trim()}

## Contexto reciente (solo referencia)
${params.recent_messages || "(Sin mensajes previos)"}`;

    const { output } = await generateText({
      model: this.openai(envs.OPENAI_MODEL),
      prompt,
      output: Output.object({ schema: leadAssistantReplySchema }),
      providerOptions: {
        openai: { strictJsonSchema: false },
      },
    });

    if (!output) {
      throw new Error("La IA no devolvió una respuesta válida.");
    }

    return {
      reply_text: output.reply_text.trim(),
      is_hot_lead: output.is_hot_lead,
    };
  }
}
