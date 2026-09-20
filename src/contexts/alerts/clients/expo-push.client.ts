import { Injectable } from "@nestjs/common";
import {
  Expo,
  type ExpoPushMessage,
  type ExpoPushReceipt,
  type ExpoPushTicket,
} from "expo-server-sdk";

import type { PushMessage } from "../types/push-message";

export interface ExpoSendOutcome {
  ok: boolean;
  /** Id del ticket para consultar el recibo (solo cuando `ok`). */
  ticket_id?: string;
  /** `ok` o el error de Expo (`DeviceNotRegistered`, `MessageRateExceeded`…). */
  code: string;
}

export interface ExpoReceiptOutcome {
  ticket_id: string;
  ok: boolean;
  code: string;
}

export const is_invalid_expo_token_error = (code: string): boolean =>
  code === "DeviceNotRegistered";

export const to_expo_message = (
  token: string,
  message: PushMessage,
): ExpoPushMessage => ({
  to: token,
  title: message.title,
  body: message.body,
  data: { ...message.data },
  sound: "default",
  priority: message.priority,
  ttl: message.ttl_seconds,
  channelId: message.channel_id,
  ...(message.thread_key ? { threadId: message.thread_key } : {}),
  ...(message.badge !== undefined ? { badge: message.badge } : {}),
});

@Injectable()
export class ExpoPushClient {
  private readonly expo = new Expo();

  /**
   * Un mensaje por token, en el mismo orden que `targets` (Expo devuelve un ticket por
   * mensaje y respeta el orden dentro de cada chunk). Nunca lanza.
   */
  async send_each(
    targets: { token: string; message: PushMessage }[],
  ): Promise<ExpoSendOutcome[]> {
    const messages = targets.map(({ token, message }) =>
      to_expo_message(token, message),
    );
    const outcomes: ExpoSendOutcome[] = [];

    for (const chunk of this.expo.chunkPushNotifications(messages)) {
      let tickets: ExpoPushTicket[];
      try {
        tickets = await this.expo.sendPushNotificationsAsync(chunk);
      } catch {
        outcomes.push(...chunk.map(() => ({ ok: false, code: "ExpoError" })));
        continue;
      }
      outcomes.push(...tickets.map((ticket) => this.map_ticket(ticket)));
    }
    return outcomes;
  }

  async get_receipts(ticket_ids: string[]): Promise<ExpoReceiptOutcome[]> {
    const outcomes: ExpoReceiptOutcome[] = [];

    for (const chunk of this.expo.chunkPushNotificationReceiptIds(ticket_ids)) {
      const receipts = await this.expo.getPushNotificationReceiptsAsync(chunk);
      for (const [ticket_id, receipt] of Object.entries(receipts)) {
        outcomes.push({ ticket_id, ...this.map_receipt(receipt) });
      }
    }

    return outcomes;
  }

  private map_ticket(ticket: ExpoPushTicket): ExpoSendOutcome {
    if (ticket.status === "ok") {
      return { ok: true, ticket_id: ticket.id, code: "ok" };
    }
    return { ok: false, code: ticket.details?.error ?? "ExpoError" };
  }

  private map_receipt(receipt: ExpoPushReceipt): { ok: boolean; code: string } {
    if (receipt.status === "ok") {
      return { ok: true, code: "ok" };
    }
    return { ok: false, code: receipt.details?.error ?? "ExpoError" };
  }
}
