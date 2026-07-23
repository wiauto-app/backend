import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import { ExecutionContext } from "@nestjs/common";
import type { Server, Socket } from "socket.io";

import { WsJwtGuard } from "@/src/contexts/auth/guards/ws-jwt.guard";

import type { PrimitiveNotification } from "../types/notification";
import { NOTIFICATION_SOCKET_EVENTS } from "./notification-socket.events";

const FRONTEND_ORIGINS = (
  process.env.FRONTEND_ORIGINS ?? "http://localhost:3000,http://localhost:5173"
)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

@WebSocketGateway({
  namespace: "/notifications",
  cors: {
    origin: FRONTEND_ORIGINS.length > 0 ? FRONTEND_ORIGINS : true,
    credentials: true,
  },
})
export class NotificationGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  constructor(private readonly ws_jwt_guard: WsJwtGuard) {}

  @WebSocketServer()
  server!: Server;

  async handleConnection(client: Socket): Promise<void> {
    try {
      const context = this.buildWsContext(client);
      const allowed = await this.ws_jwt_guard.canActivate(context);
      if (!allowed) {
        client.disconnect(true);
        return;
      }

      const profile_id = this.tryGetProfileIdFromClient(client);
      if (!profile_id) {
        client.disconnect(true);
        return;
      }

      (client.data as { profile_id?: string }).profile_id = profile_id;
      await client.join(this.getUserRoom(profile_id));
    } catch {
      client.disconnect(true);
    }
  }

  handleDisconnect(_client: Socket): void {
    // Room membership is cleaned up by socket.io on disconnect.
  }

  emitNew(notification: PrimitiveNotification): void {
    this.server
      .to(this.getUserRoom(notification.profile_id))
      .emit(NOTIFICATION_SOCKET_EVENTS.NEW, notification);
  }

  private getUserRoom(profile_id: string): string {
    return `user:${profile_id}`;
  }

  private tryGetProfileIdFromClient(client: Socket): string | undefined {
    const data_profile_id = (client.data as { profile_id?: string }).profile_id;
    if (data_profile_id) {
      return data_profile_id;
    }

    const request_user_unknown: unknown = (client.request as { user?: unknown })
      .user;
    const request_user =
      typeof request_user_unknown === "object" && request_user_unknown
        ? (request_user_unknown as { id?: unknown })
        : undefined;
    const profile_id =
      typeof request_user?.id === "string" ? request_user.id : undefined;
    if (!profile_id) {
      return undefined;
    }

    (client.data as { profile_id?: string }).profile_id = profile_id;
    return profile_id;
  }

  private buildWsContext(client: Socket): ExecutionContext {
    return {
      switchToWs: () => ({
        getClient: () => client,
      }),
      switchToHttp: () => ({
        getRequest: () => client.request,
        getResponse: () => null,
      }),
      getType: () => "ws",
      getClass: () => NotificationGateway,
      getHandler: () => this.handleConnection.bind(this),
    } as unknown as ExecutionContext;
  }
}
