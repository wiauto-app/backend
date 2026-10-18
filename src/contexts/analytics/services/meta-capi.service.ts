import { createHash } from "crypto";

import { Injectable } from "@nestjs/common";
import type { Request } from "express";

import { envs } from "@/src/common/envs";

export type MetaCapiEventName =
  | "CompleteRegistration"
  | "PublicarDatos"
  | "AnuncioPublicado";

export interface MetaCapiUserInput {
  id?: string;
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  city?: string;
  zip?: string;
}

export interface MetaEventInput {
  eventName: MetaCapiEventName;
  eventId: string;
  pageUrl: string;
  req?: Request;
  fbp?: string;
  fbc?: string;
  user?: MetaCapiUserInput;
  customData?: Record<string, unknown>;
}

export const sha256Hex = (value: string) =>
  createHash("sha256").update(value).digest("hex");

export const hashMetaEmail = (email?: string) => {
  if (!email) {
    return undefined;
  }
  const normalized = email.trim().toLowerCase();
  if (!normalized) {
    return undefined;
  }
  return sha256Hex(normalized);
};

export const hashMetaPhone = (phone?: string) => {
  if (!phone) {
    return undefined;
  }
  const digits = phone.replace(/\D/g, "");
  if (!digits) {
    return undefined;
  }
  const normalized = digits.length === 9 ? `34${digits}` : digits;
  return sha256Hex(normalized);
};

export const hashMetaText = (text?: string) => {
  if (!text) {
    return undefined;
  }
  const normalized = text
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  if (!normalized) {
    return undefined;
  }
  return sha256Hex(normalized);
};

const headerFirst = (req: Request, name: string) => {
  const raw = req.headers[name];
  const value = Array.isArray(raw) ? raw[0] : raw;
  const first = value?.split(",")[0]?.trim();
  return first || undefined;
};

export const readMetaClientIp = (req: Request) =>
  headerFirst(req, "cf-connecting-ip") ?? headerFirst(req, "x-forwarded-for");

const readUserAgent = (req: Request) => {
  const raw = req.headers["user-agent"];
  const value = Array.isArray(raw) ? raw[0] : raw;
  const agent = value?.trim();
  return agent || undefined;
};

const hashedList = (hash?: string) => (hash ? [hash] : undefined);

const omitUndefined = (record: Record<string, unknown>) => {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(record)) {
    if (value !== undefined) {
      result[key] = value;
    }
  }
  return result;
};

export const buildMetaUserData = (input: MetaEventInput) =>
  omitUndefined({
    em: hashedList(hashMetaEmail(input.user?.email)),
    ph: hashedList(hashMetaPhone(input.user?.phone)),
    fn: hashedList(hashMetaText(input.user?.firstName)),
    ln: hashedList(hashMetaText(input.user?.lastName)),
    ct: hashedList(hashMetaText(input.user?.city)),
    zp: hashedList(hashMetaText(input.user?.zip)),
    country: [sha256Hex("es")],
    external_id: input.user?.id
      ? [sha256Hex(String(input.user.id).trim())]
      : undefined,
    client_ip_address: input.req ? readMetaClientIp(input.req) : undefined,
    client_user_agent: input.req ? readUserAgent(input.req) : undefined,
    fbp: input.fbp?.trim() || undefined,
    fbc: input.fbc?.trim() || undefined,
  });

const buildCustomData = (customData?: Record<string, unknown>) => {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(customData ?? {})) {
    if (value === undefined || value === null || value === "") {
      continue;
    }
    result[key] = value;
  }
  return result;
};

@Injectable()
export class MetaCapiService {
  async sendMetaEvent(input: MetaEventInput): Promise<void> {
    const pixelId = envs.META_PIXEL_ID;
    const token = envs.META_CAPI_TOKEN;
    const apiVersion = envs.META_API_VERSION || "v21.0";

    if (!pixelId || !token || !input.eventId.trim()) {
      return;
    }

    const body: Record<string, unknown> = {
      data: [
        {
          event_name: input.eventName,
          event_time: Math.floor(Date.now() / 1000),
          event_id: input.eventId,
          action_source: "website",
          event_source_url: input.pageUrl,
          user_data: buildMetaUserData(input),
          custom_data: buildCustomData(input.customData),
        },
      ],
    };

    if (envs.META_TEST_EVENT_CODE) {
      body.test_event_code = envs.META_TEST_EVENT_CODE;
    }

    try {
      const response = await fetch(
        `https://graph.facebook.com/${apiVersion}/${pixelId}/events?access_token=${encodeURIComponent(token)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(4_000),
        },
      );

      if (!response.ok) {
        console.error("[meta-capi] http", input.eventName, response.status);
      }
    } catch {
      console.error("[meta-capi] fallo de red", input.eventName);
    }
  }
}
