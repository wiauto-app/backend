import {
  getVehicleDetailUrl,
  getVehicleEditUrl,
} from "@/src/common/frontend-routes";

import { toAbsoluteMailAssetUrl } from "./mail-public-asset-url";
import {
  formatLocationLabel,
  formatTransmissionLabel,
  humanizeSlug,
} from "./mail-template.format";

export interface MailVehicleCardPayload {
  id: string;
  title: string;
  price: number | null;
  image_url: string | null;
  year: number | null;
  mileage: number | null;
  fuel_label: string;
  transmission_label: string;
  location_label: string;
  detail_url: string;
  edit_url: string;
}

export interface BuildMailVehicleCardInput {
  id: string;
  title: string;
  price: number | null;
  image_url: string | null;
  year: number | null;
  mileage: number | null;
  fuel_label?: string;
  fuel_type_slug?: string;
  transmission_type?: string;
  transmission_label?: string;
  location_label?: string;
  municipalities_slugs?: string[];
  province_slugs?: string[];
  publisher_type: string;
}

export const buildMailVehicleCard = (
  input: BuildMailVehicleCardInput,
): MailVehicleCardPayload => {
  const fuel_label =
    input.fuel_label ??
    (input.fuel_type_slug ? humanizeSlug(input.fuel_type_slug) : "—");
  const transmission_label =
    input.transmission_label ??
    (input.transmission_type
      ? formatTransmissionLabel(input.transmission_type)
      : "—");
  const location_label =
    input.location_label ??
    formatLocationLabel(
      input.municipalities_slugs ?? [],
      input.province_slugs ?? [],
    );

  return {
    id: input.id,
    title: input.title,
    price: input.price,
    image_url: toAbsoluteMailAssetUrl(input.image_url),
    year: input.year,
    mileage: input.mileage,
    fuel_label,
    transmission_label,
    location_label,
    detail_url: getVehicleDetailUrl(input.id),
    edit_url: getVehicleEditUrl(input.id, input.publisher_type),
  };
};

export type MailStatusThemeKey =
  | "published"
  | "approved"
  | "rejected"
  | "deactivated"
  | "sold"
  | "archived"
  | "expiry_soon"
  | "expired";

export interface MailStatusTheme {
  key: MailStatusThemeKey;
  color: string;
  label: string;
  icon: string;
}

export const MAIL_STATUS_THEMES: Record<MailStatusThemeKey, MailStatusTheme> = {
  published: {
    key: "published",
    color: "#0153E8",
    label: "Publicado",
    icon: "P",
  },
  approved: {
    key: "approved",
    color: "#16A34A",
    label: "Aprobado",
    icon: "✓",
  },
  rejected: {
    key: "rejected",
    color: "#DC2626",
    label: "Rechazado",
    icon: "!",
  },
  deactivated: {
    key: "deactivated",
    color: "#6B7280",
    label: "Desactivado",
    icon: "–",
  },
  sold: {
    key: "sold",
    color: "#D97706",
    label: "Vendido",
    icon: "★",
  },
  archived: {
    key: "archived",
    color: "#6B7280",
    label: "Archivado",
    icon: "A",
  },
  expiry_soon: {
    key: "expiry_soon",
    color: "#EA580C",
    label: "Caduca pronto",
    icon: "!",
  },
  expired: {
    key: "expired",
    color: "#DC2626",
    label: "Caducado",
    icon: "!",
  },
};
