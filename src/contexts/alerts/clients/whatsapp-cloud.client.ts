import { Injectable, Logger } from "@nestjs/common";

import { envs } from "@/src/common/envs";

export interface WhatsAppTemplateBodyParameter {
  type: "text";
  text: string;
}

export interface SendWhatsAppTemplateMessageInput {
  to: string;
  body_parameters: [string, string, string];
}

interface GraphApiErrorBody {
  error?: {
    message?: string;
    type?: string;
    code?: number;
    fbtrace_id?: string;
  };
}

@Injectable()
export class WhatsAppCloudClient {
  private readonly logger = new Logger(WhatsAppCloudClient.name);

  async sendTemplateMessage(
    input: SendWhatsAppTemplateMessageInput,
  ): Promise<void> {
    const url = `https://graph.facebook.com/${envs.WHATSAPP_API_VERSION}/${envs.PHONE_NUMBER_ID}/messages`;

    const body_parameters: WhatsAppTemplateBodyParameter[] =
      input.body_parameters.map((text) => ({
        type: "text",
        text,
      }));

    const body = {
      messaging_product: "whatsapp",
      to: input.to,
      type: "template",
      template: {
        name: envs.WHATSAPP_TEMPLATE_NAME,
        language: { code: envs.WHATSAPP_TEMPLATE_LANGUAGE },
        components: [
          {
            type: "body",
            parameters: body_parameters,
          },
        ],
      },
    }
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${envs.WHATSAPP_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (response.ok) {
      return;
    }

    let error_detail = `HTTP ${response.status}`;
    try {
      const payload = (await response.json()) as GraphApiErrorBody;
      if (payload.error?.message) {
        error_detail = `${error_detail}: ${payload.error.message}`;
        if (payload.error.code != null) {
          error_detail += ` (code ${payload.error.code})`;
        }
      }
    } catch {
      // ignore JSON parse failures
    }

    throw new Error(`WhatsApp Graph API error: ${error_detail}`);
  }

  logSendFailure(context: string, error: unknown): void {
    const message = error instanceof Error ? error.message : String(error);
    this.logger.error(`${context}: ${message}`);
  }
}
