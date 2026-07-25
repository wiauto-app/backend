import { z } from "zod";
import { tool } from "ai";
import { VehicleService } from "@/src/contexts/vehicles/services/vehicle.service";
import { buildWhatsAppUrl } from "@/src/contexts/vehicles/helpers/build-whatsapp-url";
import { buildAssistantVehicleSummary } from "../helpers/build-assistant-vehicle-summary";
import type {
  PrepareSellerContactResult,
  SellerContactChannel,
} from "../types/prepare-seller-contact";

const prepareSellerContactInputSchema = z.object({
  vehicle_id: z.string().uuid(),
});

/** Preguntas fijas recomendadas al contactar al vendedor (5–8). */
export const RECOMMENDED_SELLER_QUESTIONS: string[] = [
  "¿Sigue disponible el vehículo?",
  "¿Tiene historial de servicio o libro de mantenimiento?",
  "¿Cuántos dueños ha tenido?",
  "¿Cuál es el motivo de la venta?",
  "¿Es posible hacer una prueba de conducción?",
  "¿Ha tenido accidentes o reparaciones importantes?",
  "¿El precio es negociable?",
  "¿Incluye algún extra, llaves de repuesto o documentación completa?",
];

interface CreatePrepareSellerContactToolOptions {
  vehicleService: VehicleService;
}

export const createPrepareSellerContactTool = ({
  vehicleService,
}: CreatePrepareSellerContactToolOptions) =>
  tool({
    description:
      "OBLIGATORIA cuando el usuario quiere contactar / contactar al vendedor / hablar con el vendedor / pedir más información al vendedor / WhatsApp / teléfono / email de un anuncio concreto. Prepara canales reales (WhatsApp, teléfono, email), mensaje sugerido y preguntas recomendadas. Requiere vehicle_id (UUID del anuncio; usa el del último analyzeListing si no lo repite). NUNCA uses searchVehicles ni inventes tools como contactSeller: el nombre exacto es prepareSellerContact.",
    inputSchema: prepareSellerContactInputSchema,
    execute: async ({
      vehicle_id,
    }): Promise<PrepareSellerContactResult> => {
      const detail = await vehicleService.findOne({ id: vehicle_id });
      const summary = buildAssistantVehicleSummary(detail);

      const suggested_message = [
        `Hola, me interesa tu ${summary.title}`,
        `publicado en WiAuto por ${summary.price} €`,
        `(${summary.mileage} km).`,
        "¿Sigue disponible? ¿Podríamos concertar una visita o una videollamada?",
      ].join(" ");

      const channels: SellerContactChannel[] = [];

      if (detail.has_whatsapp && detail.phone_code && detail.phone) {
        channels.push({
          type: "whatsapp",
          label: "WhatsApp",
          value: `${detail.phone_code}${detail.phone}`,
          href: buildWhatsAppUrl(
            detail.phone_code,
            detail.phone,
            suggested_message,
          ),
        });
      }

      if (detail.show_phone && detail.phone_code && detail.phone) {
        const phoneValue = `${detail.phone_code}${detail.phone}`;
        channels.push({
          type: "phone",
          label: "Teléfono",
          value: phoneValue,
          href: `tel:${phoneValue.replace(/\s+/g, "")}`,
        });
      }

      if (detail.email?.trim()) {
        channels.push({
          type: "email",
          label: "Email",
          value: detail.email.trim(),
          href: `mailto:${detail.email.trim()}?subject=${encodeURIComponent(
            `Interés en ${summary.title}`,
          )}&body=${encodeURIComponent(suggested_message)}`,
        });
      }

      return {
        channels,
        suggested_message,
        recommended_questions: [...RECOMMENDED_SELLER_QUESTIONS],
        vehicle_summary: {
          id: summary.id,
          title: summary.title,
          price: summary.price,
          mileage: summary.mileage,
          year: summary.year,
        },
      };
    },
  });
