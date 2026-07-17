import { Injectable } from "@nestjs/common";
import { envs } from "@/src/common/envs";
import { generateText, Output } from "ai";
import { createDeepSeek } from "@ai-sdk/deepseek";
import { z } from "zod";

import { mapDescriptionGenerationSettings } from "./description-generation-settings.mapper";
import { GenerationSettingsDto } from "../dto/vehicle-ai-context.dto";
import { ResolvedVehicleAiLabels } from "./vehicle-ai-context-resolver.service";
import { VehicleMarketStatsResult } from "./vehicle-market-stats.service";

const aiPriceRecommendationSchema = z.object({
  recommended_price: z.number().int().positive(),
  range_min: z.number().int().positive(),
  range_max: z.number().int().positive(),
  explanation: z.string().min(1),
});

export interface AiPriceRecommendationResult {
  recommended_price: number;
  range_min: number;
  range_max: number;
  explanation: string;
}

@Injectable()
export class VehicleAiPromptService {
  buildPriceRecommendationPrompt(
    labels: ResolvedVehicleAiLabels,
    stats: VehicleMarketStatsResult,
  ): string {
    return `Eres un asesor de precios de vehículos usados y nuevos en el marketplace WiAuto (España).

Tu tarea es redactar una explicación breve y clara en español neutro para el vendedor sobre la recomendación de precio. No inventes cifras: usa únicamente los datos proporcionados.

## Vehículo
- Marca: ${labels.make_name}
- Modelo: ${labels.model_name}
- Versión: ${labels.version_name}
- Año: ${labels.year}
- Combustible: ${labels.fuel_type_name}
- Estado: ${labels.condition}
- Kilometraje: ${labels.mileage} km
- Transmisión: ${labels.transmission_type}
- Potencia: ${labels.power} CV
${labels.traction_name ? `- Tracción: ${labels.traction_name}` : ""}
${labels.color_name ? `- Color: ${labels.color_name}` : ""}

## Estadísticas de mercado (calculadas en la plataforma)
- Precio recomendado (mediana): ${stats.recommended_price} €
- Rango probable (P25–P75): ${stats.range_min} € – ${stats.range_max} €
- Anuncios similares analizados: ${stats.sample_count}
- Nivel de similitud: tier ${stats.tier}
- Confianza: ${stats.confidence}

## Instrucciones
- Máximo 3 párrafos cortos.
- Explica por qué ese rango es razonable según los comparables.
- Menciona la confianza de forma comprensible (alta/media/baja).
- No uses markdown ni listas con viñetas.
- Usa léxico y terminología del mercado de vehículos de segunda mano y concesionarios en España.
- No repitas todas las cifras en bloque; intégralas en el texto.`;
  }

  buildDescriptionPrompt(
    labels: ResolvedVehicleAiLabels,
    settings?: GenerationSettingsDto,
  ): string {
    const mapped_settings = mapDescriptionGenerationSettings(settings);
    const optional_lines = [
      labels.displacement ? `- Cilindrada: ${labels.displacement} cc` : null,
      labels.autonomy ? `- Autonomía: ${labels.autonomy} km` : null,
      labels.battery_capacity
        ? `- Capacidad batería: ${labels.battery_capacity} kWh`
        : null,
      labels.time_to_charge
        ? `- Tiempo de carga: ${labels.time_to_charge} h`
        : null,
      labels.color_name ? `- Color: ${labels.color_name}` : null,
      labels.dgt_label_name ? `- Etiqueta DGT: ${labels.dgt_label_name}` : null,
      labels.traction_name ? `- Tracción: ${labels.traction_name}` : null,
      labels.vehicle_type_name
        ? `- Tipo de vehículo: ${labels.vehicle_type_name}`
        : null,
      labels.category_name ? `- Categoría: ${labels.category_name}` : null,
      labels.publisher_type
        ? `- Tipo de vendedor: ${labels.publisher_type}`
        : null,
    ]
      .filter(Boolean)
      .join("\n");

    const format_section = mapped_settings.is_very_short
      ? `## Formato de salida (texto plano, NO markdown)
La descripción se mostrará en un campo de texto sin renderizado.
Escribe solo 1-2 líneas atractivas. No uses secciones ni listas.`
      : mapped_settings.is_short
        ? `## Formato de salida (texto plano, NO markdown)
La descripción se mostrará en un campo de texto sin renderizado. Usa saltos de línea si hace falta.

Estructura sugerida:
1. Un párrafo breve que presente el vehículo.
2. Opcional: 2-3 puntos clave con prefijo "• " o "- " (sin markdown).
3. Sin secciones largas ni llamada a la acción extensa.`
        : `## Formato de salida (texto plano, NO markdown)
La descripción se mostrará en un campo de texto sin renderizado. Usa saltos de línea y espaciado para que sea legible tal cual.

Estructura sugerida:
1. Párrafo inicial breve que presente el vehículo de forma atractiva.
2. Línea en blanco entre secciones.
3. Secciones con etiqueta en texto plano seguida de dos puntos, por ejemplo:
   Estado y kilometraje:
   (contenido en las líneas siguientes)
4. Para equipamiento o puntos destacados, usa líneas con prefijo "• " o "- " (sin markdown).
5. Párrafo final opcional con llamada a la acción (visita, prueba, contacto).`;

    return `Eres un redactor profesional de anuncios de vehículos para WiAuto (España).

Redacta la descripción de un anuncio atractiva, honesta y en español neutro, orientada al mercado de vehículos de ocasión y concesionarios en España.

## Datos del vehículo
- Marca: ${labels.make_name}
- Modelo: ${labels.model_name}
- Versión: ${labels.version_name}
- Año: ${labels.year}
- Combustible: ${labels.fuel_type_name}
- Estado: ${labels.condition === "new" ? "nuevo" : "usado"}
- Kilometraje: ${labels.mileage} km
- Transmisión: ${labels.transmission_type}
- Potencia: ${labels.power} CV
${optional_lines}

${mapped_settings.preferences_block}

${format_section}

## Reglas de contenido
- Respeta el tono y la persuasión indicados en Preferencias del vendedor.
- Ajusta la longitud a la extensión indicada en Preferencias del vendedor.
- Oriéntate al público objetivo indicado y al mercado español.
- No inventes equipamiento, historial ni garantías no indicados.
- No uses markdown (#, **, _, listas numeradas markdown, enlaces).
- No uses emojis.
- Devuelve solo el texto de la descripción, sin comillas envolventes ni título del anuncio.`;
  }

  buildAiPriceFallbackPrompt(labels: ResolvedVehicleAiLabels): string {
    const optional_lines = [
      labels.displacement ? `- Cilindrada: ${labels.displacement} cc` : null,
      labels.autonomy ? `- Autonomía: ${labels.autonomy} km` : null,
      labels.battery_capacity
        ? `- Capacidad batería: ${labels.battery_capacity} kWh`
        : null,
      labels.time_to_charge
        ? `- Tiempo de carga: ${labels.time_to_charge} h`
        : null,
      labels.color_name ? `- Color: ${labels.color_name}` : null,
      labels.dgt_label_name ? `- Etiqueta DGT: ${labels.dgt_label_name}` : null,
      labels.traction_name ? `- Tracción: ${labels.traction_name}` : null,
      labels.vehicle_type_name
        ? `- Tipo de vehículo: ${labels.vehicle_type_name}`
        : null,
      labels.category_name ? `- Categoría: ${labels.category_name}` : null,
      labels.publisher_type
        ? `- Tipo de vendedor: ${labels.publisher_type}`
        : null,
    ]
      .filter(Boolean)
      .join("\n");

    return `Eres un tasador experto del mercado de vehículos usados y nuevos en España.

Estima un rango de precio de venta razonable en euros (EUR) para el siguiente vehículo. No hay suficientes anuncios comparables en la plataforma WiAuto; basa tu estimación en el mercado español de segunda mano y concesionarios.

## Vehículo
- Marca: ${labels.make_name}
- Modelo: ${labels.model_name}
- Versión: ${labels.version_name}
- Año: ${labels.year}
- Combustible: ${labels.fuel_type_name}
- Estado: ${labels.condition === "new" ? "nuevo" : "usado"}
- Kilometraje: ${labels.mileage} km
- Transmisión: ${labels.transmission_type}
- Potencia: ${labels.power} CV
${optional_lines}

## Instrucciones
- recommended_price: precio orientativo de venta en EUR (entero).
- range_min y range_max: rango probable de mercado en EUR (enteros), con range_min <= recommended_price <= range_max.
- explanation: texto breve en español neutro (máximo 3 párrafos cortos) que justifique la estimación según marca, modelo, año, kilometraje y estado en el mercado español.
- No uses markdown ni listas con viñetas en explanation.
- Sé conservador: mejor un rango algo amplio que cifras irreales.`;
  }

  async generateAiPriceRecommendation(
    labels: ResolvedVehicleAiLabels,
  ): Promise<AiPriceRecommendationResult> {
    const deepseek = createDeepSeek({
      apiKey: envs.DEEPSEEK_API_KEY,
    });

    const { output } = await generateText({
      model: deepseek(envs.DEEPSEEK_MODEL),
      output: Output.object({
        schema: aiPriceRecommendationSchema,
      }),
      prompt: this.buildAiPriceFallbackPrompt(labels),
    });

    return output;
  }

  async generatePriceExplanation(
    labels: ResolvedVehicleAiLabels,
    stats: VehicleMarketStatsResult,
  ): Promise<string> {
    const deepseek = createDeepSeek({
      apiKey: envs.DEEPSEEK_API_KEY,
    });

    const { text } = await generateText({
      model: deepseek(envs.DEEPSEEK_MODEL),
      prompt: this.buildPriceRecommendationPrompt(labels, stats),
    });

    return text.trim();
  }

  async generateDescription(
    labels: ResolvedVehicleAiLabels,
    settings?: GenerationSettingsDto,
  ): Promise<string> {
    const deepseek = createDeepSeek({
      apiKey: envs.DEEPSEEK_API_KEY,
    });

    const { text } = await generateText({
      model: deepseek(envs.DEEPSEEK_MODEL),
      prompt: this.buildDescriptionPrompt(labels, settings),
    });

    return text.trim();
  }
}
