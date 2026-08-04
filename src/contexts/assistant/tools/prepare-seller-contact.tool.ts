import { tool } from "ai";
import { VehicleService } from "@/src/contexts/vehicles/services/vehicle.service";
import { buildWhatsAppUrl } from "@/src/contexts/vehicles/helpers/build-whatsapp-url";
import { buildAssistantVehicleSummary } from "../helpers/build-assistant-vehicle-summary";
import {
  assistantVehicleTargetSchema,
  resolveAssistantVehicleId,
} from "../helpers/resolve-assistant-vehicle-id";
import type {
  PrepareSellerContactResult,
  SellerContactChannel,
} from "../types/prepare-seller-contact";

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
      "OBLIGATORIA cuando el usuario quiere contactar / contactar al vendedor / hablar con el vendedor / pedir más información al vendedor / chat WiAuto / WhatsApp / teléfono / email de un anuncio concreto. Prepara canales reales (Chat WiAuto preferente, WhatsApp, teléfono, email), mensaje sugerido y preguntas recomendadas. Prefiere vehicle_ref (Ref. N del anuncio); vehicle_id UUID solo como fallback. NUNCA uses searchVehicles ni inventes tools como contactSeller: el nombre exacto es prepareSellerContact.",
    inputSchema: assistantVehicleTargetSchema,
    execute: async (input): Promise<PrepareSellerContactResult> => {
      const vehicle_id = await resolveAssistantVehicleId(input, {
        vehicleService,
      });
      const detail = await vehicleService.findOne({ id: vehicle_id });
      const contact = await vehicleService.findSellerContactFields(vehicle_id);
      const summary = buildAssistantVehicleSummary(detail);

      const suggested_message = [
        `Hola, me interesa tu ${summary.title}`,
        `publicado en WiAuto por ${summary.price} €`,
        `(${summary.mileage} km).`,
        "¿Sigue disponible? ¿Podríamos concertar una visita o una videollamada?",
      ].join(" ");

      const channels: SellerContactChannel[] = [];

      if (contact.profile_id) {
        channels.push({
          type: "wiauto_chat",
          label: "Chat WiAuto",
          value: vehicle_id,
          publisher_profile_id: contact.profile_id,
          vehicle_id,
          vehicle_ref: contact.ref,
        });
      }

      if (contact.has_whatsapp && contact.phone_code && contact.phone) {
        channels.push({
          type: "whatsapp",
          label: "WhatsApp",
          value: `${contact.phone_code}${contact.phone}`,
          href: buildWhatsAppUrl(
            contact.phone_code,
            contact.phone,
            suggested_message,
          ),
        });
      }

      if (contact.show_phone && contact.phone_code && contact.phone) {
        const phoneValue = `${contact.phone_code}${contact.phone}`;
        channels.push({
          type: "phone",
          label: "Teléfono",
          value: phoneValue,
          href: `tel:${phoneValue.replace(/\s+/g, "")}`,
        });
      }

      if (contact.email?.trim()) {
        channels.push({
          type: "email",
          label: "Email",
          value: contact.email.trim(),
          href: `mailto:${contact.email.trim()}?subject=${encodeURIComponent(
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
          ref: summary.ref,
          title: summary.title,
          price: summary.price,
          mileage: summary.mileage,
          year: summary.year,
        },
      };
    },
  });
